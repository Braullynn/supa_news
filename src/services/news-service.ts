import Parser from 'rss-parser';
import { logger } from '@/lib/logger';

const parser = new Parser();
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

export interface RawArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image?: string;
  source: string;
  category: string;
}

export const NewsService = {
  // 1. Buscar Notícias de Tecnologia (GNews)
  async fetchTechNews(): Promise<RawArticle[]> {
    try {
      logger.info('NewsService', 'Iniciando busca de notícias Tech no GNews...');
      const response = await fetch(`https://gnews.io/api/v4/top-headlines?category=technology&lang=pt&country=br&max=5&apikey=${GNEWS_API_KEY}`);
      const data = await response.json();

      if (!data.articles) {
        throw new Error(data.message || 'Erro ao buscar notícias no GNews');
      }

      return data.articles.map((a: any) => ({
        title: a.title,
        description: a.description,
        content: a.content,
        url: a.url,
        image: a.image,
        source: a.source.name,
        category: 'Tecnologia'
      }));
    } catch (error: any) {
      logger.error('NewsService', 'Erro ao buscar notícias Tech', error.message);
      return [];
    }
  },

  // 2. Buscar Notícias em Alta (Google News RSS como fallback/trending)
  async fetchTrendingNews(): Promise<RawArticle[]> {
    try {
      logger.info('NewsService', 'Iniciando busca de notícias Trending via RSS...');
      const feed = await parser.parseURL('https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419');
      
      // Pegar os primeiros itens e mapear
      return feed.items.slice(0, 5).map((item: any) => ({
        title: item.title,
        description: item.contentSnippet || '',
        content: item.content || '',
        url: item.link,
        source: item.source || 'Google News',
        category: 'Tendências'
      }));
    } catch (error: any) {
      logger.error('NewsService', 'Erro ao buscar notícias Trending', error.message);
      return [];
    }
  }
};
