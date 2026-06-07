import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

export class BackupService {
  private static readonly RETENTION_DAYS = 10;
  private static readonly PROCESS = 'BACKUP_SERVICE';

  static async createBackup() {
    try {
      logger.info(this.PROCESS, 'Iniciando backup da tabela noticias');
      
      // 1. Fetch data
      const { data, error } = await supabaseAdmin.from('noticias').select('*');
      
      if (error) {
        throw new Error(`Erro ao buscar dados do Supabase: ${error.message}`);
      }

      if (!data || data.length === 0) {
        logger.info(this.PROCESS, 'Nenhum dado encontrado para backup');
        return { success: true, message: 'Nenhum dado para backup' };
      }

      // 2. Prepare payload
      const timestamp = new Date().toISOString();
      const payload = {
        version: 1,
        table: 'noticias',
        count: data.length,
        createdAt: timestamp,
        data: data
      };

      // 3. Compress
      const compressedBuffer = await gzipAsync(JSON.stringify(payload));
      
      // 4. Upload to R2
      const dateStr = timestamp.replace(/[:.]/g, '-');
      const filename = `backups/noticias/${dateStr}.json.gz`;

      const uploadCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: filename,
        Body: compressedBuffer,
        ContentType: 'application/gzip',
      });

      await r2Client.send(uploadCommand);
      
      logger.info(this.PROCESS, `Backup ${filename} criado com sucesso. Total de registros: ${data.length}`);

      return { success: true, filename, count: data.length };
    } catch (error: any) {
      logger.error(this.PROCESS, 'Falha ao criar backup', error.message);
      return { success: false, error: error.message };
    }
  }

  static async cleanOldBackups() {
    try {
      logger.info(this.PROCESS, `Limpando backups com mais de ${this.RETENTION_DAYS} dias`);
      
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'backups/noticias/'
      });

      const response = await r2Client.send(listCommand);
      
      if (!response.Contents || response.Contents.length === 0) {
        logger.info(this.PROCESS, 'Nenhum backup encontrado para limpeza');
        return { success: true, deleted: 0 };
      }

      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000));
      
      let deletedCount = 0;

      for (const item of response.Contents) {
        if (item.Key && item.LastModified && item.LastModified < cutoffDate) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: item.Key
          });
          await r2Client.send(deleteCommand);
          logger.info(this.PROCESS, `Backup antigo apagado: ${item.Key}`);
          deletedCount++;
        }
      }

      return { success: true, deleted: deletedCount };
    } catch (error: any) {
      logger.error(this.PROCESS, 'Falha ao limpar backups antigos', error.message);
      return { success: false, error: error.message };
    }
  }
}
