import { textModel } from '@/lib/gemini';
import { logger } from '@/lib/logger';

export const ContentService = {
  // Reformular a notícia para evitar plágio
  async rewriteArticle(title: string, content: string) {
    try {
      logger.info('ContentService', `Reformulando notícia: ${title.substring(0, 30)}...`);
      
      const prompt = `
        Você é um editor sênior de um jornal moderno chamado "Supa News!".
        Sua tarefa é reformular a notícia abaixo para que seja original, profissional e envolvente.
        Evite plágio, mas mantenha todos os fatos importantes.
        
        Título original: ${title}
        Conteúdo original: ${content}

        Responda APENAS em formato JSON com a seguinte estrutura:
        {
          "titulo": "Novo título impactante",
          "resumo": "Um resumo de 2 frases para o card",
          "conteudo": "O texto completo da notícia formatado em parágrafos"
        }
      `;

      const result = await textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Limpar possíveis markdown do Gemini
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error: any) {
      logger.error('ContentService', 'Erro ao reformular notícia', error.message);
      return null;
    }
  },

  // Gerar prompt de imagem baseado no conteúdo
  async generateImagePrompt(title: string, summary: string) {
    try {
      logger.info('ContentService', 'Gerando prompt de imagem...');
      
      const prompt = `
        Com base na notícia: "${title}" e no resumo: "${summary}".
        Crie um prompt detalhado em INGLÊS para uma inteligência artificial geradora de imagens (como Stable Diffusion ou Imagen).
        O estilo deve ser fotorealista, cinematográfico, estilo editorial de jornal.
        Responda apenas o texto do prompt.
      `;

      const result = await textModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      logger.error('ContentService', 'Erro ao gerar prompt de imagem', error.message);
      return "A professional newspaper editorial photography about news";
    }
  }
};
