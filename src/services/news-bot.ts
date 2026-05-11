import { NewsService, RawArticle } from './news-service';
import { ContentService } from './content-service';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const NewsBot = {
  async runPipeline() {
    const PROCESS_NAME = 'NewsBot_Pipeline';
    try {
      logger.info(PROCESS_NAME, 'Iniciando pipeline diária...');

      // 1. Buscar Notícias
      const techRaw = await NewsService.fetchTechNews();
      const trendingRaw = await NewsService.fetchTrendingNews();

      // Selecionar 2 Tech e 3 Trending
      const selectedArticles: RawArticle[] = [
        ...techRaw.slice(0, 2),
        ...trendingRaw.slice(0, 3)
      ];

      logger.info(PROCESS_NAME, `Selecionadas ${selectedArticles.length} notícias para processamento.`);

      for (const article of selectedArticles) {
        try {
          // 2. Reformular Conteúdo com Gemini
          const rewritten = await ContentService.rewriteArticle(article.title, article.content || article.description);
          if (!rewritten) continue;

          // 3. Gerar Prompt de Imagem
          const imagePrompt = await ContentService.generateImagePrompt(rewritten.titulo, rewritten.resumo);

          // 4. Geração de Imagem (Placeholder por enquanto até validar API de imagem específica)
          // Implementação da lógica de Retry que você pediu:
          let imageUrl = await this.generateImageWithRetry(imagePrompt, article.category);

          // 5. Salvar no Supabase (usando cliente Admin para ignorar RLS)
          const { error } = await supabaseAdmin.from('noticias').insert([{
            titulo: rewritten.titulo,
            conteudo: rewritten.conteudo,
            resumo: rewritten.resumo,
            imagem_url: imageUrl,
            categoria: article.category,
            fonte_nome: article.source,
            fonte_url: article.url,
            slug: this.slugify(rewritten.titulo)
          }]);

          if (error) throw error;
          
          logger.info(PROCESS_NAME, `Notícia publicada: ${rewritten.titulo}`);

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
    let attempts = 0;
    const maxAttempts = 2; // Tentativa original + 1 retry

    while (attempts < maxAttempts) {
      try {
        attempts++;
        logger.info(PROCESS, `Tentativa ${attempts} de gerar imagem para categoria ${category}`);
        
        // Aqui entrará a chamada real para a API de imagem (Nano Banana / Pollinations)
        // Por enquanto, simulando ou usando Pollinations (Grátis e Funciona sempre para testes)
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1000&height=600&seed=${Math.floor(Math.random() * 1000)}&nologo=true`;
        
        // Verificar se a imagem é válida (opcional)
        return url;

      } catch (err) {
        if (attempts >= maxAttempts) {
          logger.warn(PROCESS, 'Todas as tentativas falharam. Usando placeholder.');
          return this.getPlaceholderByCategory(category);
        }
      }
    }
    return this.getPlaceholderByCategory(category);
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
