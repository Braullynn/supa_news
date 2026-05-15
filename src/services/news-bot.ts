import { NewsService, RawArticle } from './news-service';
import { ContentService } from './content-service';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { CloudflareAI } from '@/lib/cloudflare-ai';
import { sanitizeContent } from './content-sanitizer';
import { validateQuality } from './content-validator';
import sharp from 'sharp';

export const NewsBot = {
  async runPipeline(customDate?: string) {
    const PROCESS_NAME = 'NewsBot_Pipeline';
    try {
      if (customDate && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(customDate)) {
        throw new Error(`Data customizada inválida: ${customDate}`);
      }
      
      logger.info(PROCESS_NAME, `Iniciando pipeline... ${customDate ? '(Data customizada: ' + customDate + ')' : ''}`);

      // 1. Buscar Notícias
      const techRaw = await NewsService.fetchTechNews();
      const trendingRaw = await NewsService.fetchTrendingNews();

      // Selecionar 2 Tech e 3 Trending
      const selectedArticles: RawArticle[] = [
        ...techRaw.slice(0, 5), // Pegamos um pouco mais para garantir que teremos saldo após o filtro
        ...trendingRaw.slice(0, 5)
      ];

      // --- FILTRO DE DUPLICIDADE ---
      logger.info(PROCESS_NAME, 'Verificando duplicidade no banco de dados...');
      const urls = selectedArticles.map(a => a.url);
      
      const { data: existingNews, error: fetchError } = await supabaseAdmin
        .from('noticias')
        .select('fonte_url')
        .in('fonte_url', urls);

      if (fetchError) {
        logger.error(PROCESS_NAME, 'Erro ao verificar duplicidade', fetchError.message);
      }

      const existingUrls = new Set(existingNews?.map(n => n.fonte_url) || []);
      
      // Filtrar as que não existem e limitar ao planejado (2 tech, 3 trending)
      const uniqueTech = techRaw.filter(a => !existingUrls.has(a.url)).slice(0, 2);
      const uniqueTrending = trendingRaw.filter(a => !existingUrls.has(a.url)).slice(0, 3);
      
      const finalArticles = [...uniqueTech, ...uniqueTrending];

      if (finalArticles.length === 0) {
        logger.info(PROCESS_NAME, 'Nenhuma notícia nova encontrada (todas já postadas).');
        return { success: true, message: 'Nada novo para publicar.' };
      }

      logger.info(PROCESS_NAME, `${finalArticles.length} notícias inéditas selecionadas para processamento.`);

      for (const article of finalArticles) {
        try {
          // 2. Reformular Conteúdo com Gemini/Groq
          let rewritten = await ContentService.rewriteArticle(article.title, article.content || article.description);
          if (!rewritten) continue;

          // 2.5 — SANITIZAÇÃO E VALIDAÇÃO
          rewritten.titulo = sanitizeContent(rewritten.titulo);
          rewritten.resumo = sanitizeContent(rewritten.resumo);
          rewritten.conteudo = sanitizeContent(rewritten.conteudo);

          let validation = validateQuality(rewritten.titulo, rewritten.resumo, rewritten.conteudo);
          
          // Lógica de Re-tentativa (Option B)
          if (!validation.approved) {
            logger.warn(PROCESS_NAME, `Notícia reprovada na 1ª tentativa: ${rewritten.titulo}`, validation.issues);
            
            // Tentativa 2 com prompt mais rígido (usando o conteúdo já "quase bom" como base)
            const repairPrompt = `CORRIJA ESTA NOTÍCIA. Erros detectados: ${validation.issues.join(', ')}. Texto atual: ${rewritten.conteudo}`;
            rewritten = await ContentService.rewriteArticle(rewritten.titulo, repairPrompt);
            
            if (rewritten) {
              rewritten.titulo = sanitizeContent(rewritten.titulo);
              rewritten.resumo = sanitizeContent(rewritten.resumo);
              rewritten.conteudo = sanitizeContent(rewritten.conteudo);
              validation = validateQuality(rewritten.titulo, rewritten.resumo, rewritten.conteudo);
            }
          }

          if (!validation.approved) {
            logger.error(PROCESS_NAME, `Notícia reprovada após re-tentativa: ${article.title}`, validation.issues);
            continue;
          }

          // 3. Gerar Prompt de Imagem
          const imagePrompt = await ContentService.generateImagePrompt(rewritten.titulo, rewritten.resumo);

          // 4. Geração de Imagem com Retry e Upload para Storage
          let imageUrl = await this.generateImageWithRetry(imagePrompt, article.category);

          // 5. Salvar no Supabase
          const insertData: any = {
            titulo: rewritten.titulo,
            conteudo: rewritten.conteudo,
            resumo: rewritten.resumo,
            imagem_url: imageUrl,
            categoria: article.category,
            fonte_nome: article.source,
            fonte_url: article.url,
            slug: this.slugify(rewritten.titulo)
          };

          // Se tiver data customizada, adiciona ao insert
          if (customDate) {
            insertData.data_publicacao = customDate;
          }

          const { error } = await supabaseAdmin.from('noticias').insert([insertData]);

          if (error) throw error;
          
          logger.info(PROCESS_NAME, `Notícia publicada: ${rewritten.titulo}`);

          // 6. Limpeza automática do Bucket
          await this.cleanupOldImages();

        } catch (err: any) {
          logger.error(PROCESS_NAME, `Erro ao processar artigo: ${article.title}`, err.message);
        }
      }

      logger.info(PROCESS_NAME, 'Pipeline finalizada com sucesso!');
      return { success: true };
    } catch (error: any) {
      logger.error(PROCESS_NAME, 'Erro crítico na pipeline', error.message);
      return { success: false, error: error.message };
    }
  },

  async generateImageWithRetry(prompt: string, category: string): Promise<string> {
    const PROCESS = 'ImageGeneration';
    
    // TENTATIVA 1: Cloudflare Workers AI
    try {
      logger.info(PROCESS, 'Tentativa 1: Cloudflare Workers AI');
      const imageBuffer = await CloudflareAI.generateImage(prompt);
      
      if (imageBuffer) {
        const publicUrl = await this.uploadToStorage(imageBuffer);
        if (publicUrl) return publicUrl;
      }
    } catch (err: any) {
      logger.warn(PROCESS, `Falha na Cloudflare: ${err.message}`);
    }

    // TENTATIVA 2: Fallback Pollinations (Baixando e subindo pro Storage)
    try {
      logger.info(PROCESS, 'Tentativa 2: Fallback Pollinations (modelo flux)');
      const encodedPrompt = encodeURIComponent(prompt);
      const pollinationsUrl = `https://gen.pollinations.ai/prompt/${encodedPrompt}?width=1000&height=600&model=flux&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
      
      const response = await fetch(pollinationsUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const publicUrl = await this.uploadToStorage(Buffer.from(arrayBuffer));
        if (publicUrl) return publicUrl;
      }
    } catch (err: any) {
      logger.warn(PROCESS, `Falha no Pollinations Fallback: ${err.message}`);
    }

    // FALLBACK FINAL: Placeholder Unsplash
    logger.warn(PROCESS, 'Todas as tentativas de geração falharam. Usando placeholder.');
    return this.getPlaceholderByCategory(category);
  },

  async uploadToStorage(buffer: Buffer): Promise<string | null> {
    const PROCESS = 'StorageUpload';
    try {
      // COMPRESSÃO: PNG (Cloudflare) -> JPEG (800x450)
      // Otimizado para até 1MB, mas geralmente fica em ~150KB
      let processedBuffer = await sharp(buffer)
        .resize(800, 450, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      // Double check: Se ainda for maior que 1MB, reduzimos a qualidade drasticamente
      if (processedBuffer.length > 1024 * 1024) {
        processedBuffer = await sharp(processedBuffer)
          .jpeg({ quality: 60 })
          .toBuffer();
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
      const filePath = `noticias-imagens/${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from('noticias-imagens')
        .upload(filePath, processedBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('noticias-imagens')
        .getPublicUrl(filePath);

      logger.info(PROCESS, `Upload concluído: ${publicUrl} (${(processedBuffer.length / 1024).toFixed(1)} KB)`);
      return publicUrl;
    } catch (error: any) {
      logger.error(PROCESS, 'Erro ao processar/fazer upload da imagem', error.message);
      return null;
    }
  },

  async cleanupOldImages() {
    const PROCESS = 'StorageCleanup';
    const LIMIT = 35;
    const REMOVE_COUNT = 5;

    try {
      // 1. Listar arquivos ordenados por nome (timestamp)
      const { data: files, error } = await supabaseAdmin.storage
        .from('noticias-imagens')
        .list('noticias-imagens', { 
          sortBy: { column: 'name', order: 'asc' } 
        });

      if (error || !files || files.length <= LIMIT) return;

      // 2. Identificar os 5 mais antigos
      const toDelete = files.slice(0, REMOVE_COUNT);
      const pathsToDelete = toDelete.map(f => `noticias-imagens/${f.name}`);
      
      logger.info(PROCESS, `Iniciando limpeza: removendo ${REMOVE_COUNT} imagens antigas...`);

      // 3. Antes de excluir, atualizar as notícias no banco para o placeholder (Opção B)
      for (const file of toDelete) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('noticias-imagens')
          .getPublicUrl(`noticias-imagens/${file.name}`);

        await supabaseAdmin
          .from('noticias')
          .update({ imagem_url: this.getPlaceholderByCategory('fallback') })
          .eq('imagem_url', publicUrl);
      }

      // 4. Excluir do Storage
      const { error: deleteError } = await supabaseAdmin.storage
        .from('noticias-imagens')
        .remove(pathsToDelete);

      if (deleteError) throw deleteError;

      logger.info(PROCESS, `Limpeza concluída com sucesso.`);
    } catch (error: any) {
      logger.error(PROCESS, 'Erro na rotina de limpeza do bucket', error.message);
    }
  },

  getPlaceholderByCategory(category: string): string {
    const placeholders: Record<string, string> = {
      'Tecnologia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000',
      'Tendências': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000',
      'fallback': 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1000'
    };
    return placeholders[category] || placeholders['fallback'];
  },

  slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      + '-' + Math.random().toString(36).substring(2, 7);
  }
};
