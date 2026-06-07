import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/services/backup-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const PROCESS = 'API_BACKUP_EXECUTE';
  const CRON_SECRET = process.env.CRON_SECRET;
  
  // Autenticação
  const authHeader = request.headers.get('authorization');
  const isValid = authHeader === `Bearer ${CRON_SECRET}`;

  if (!isValid) {
    logger.warn(PROCESS, 'Tentativa de acesso não autorizada', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info(PROCESS, 'Execução de backup autorizada');
    
    // Executa backup
    const backupResult = await BackupService.createBackup();
    
    if (!backupResult.success) {
      return NextResponse.json({ 
        message: 'Erro ao criar backup',
        error: backupResult.error 
      }, { status: 500 });
    }

    // Executa limpeza
    const cleanupResult = await BackupService.cleanOldBackups();

    return NextResponse.json({ 
      message: 'Backup concluído com sucesso',
      backup: backupResult,
      cleanup: cleanupResult,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    logger.error(PROCESS, 'Falha crítica no endpoint de backup', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
