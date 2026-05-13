import { textModel } from '@/lib/gemini';
import { groq } from '@/lib/groq';
import { logger } from '@/lib/logger';

export const ContentService = {
  // Reformular a notícia para evitar plágio (Agora via GROQ com fallback Gemini)
  async rewriteArticle(title: string, content: string) {
    const prompt = `
      Você é um editor sênior de um jornal moderno chamado "Supa News!".
      Sua tarefa é reformular a notícia abaixo para que seja original, profissional e envolvente.
      Evite plágio, mas mantenha todos os fatos importantes.
      
      REGRAS CRÍTICAS:
      1. Responda ESTRITAMENTE em Português do Brasil (PT-BR).
      2. Não use palavras em outros idiomas (como inglês, russo ou espanhol).
      3. O tom deve ser jornalístico profissional.
      4. NÃO inclua tags HTML (como <br>, <p>, <strong>) no texto — apenas texto puro.
      5. NÃO inclua markdown (como **, ##, __) no texto.
      6. Cada parágrafo deve ser uma frase completa, terminando com ponto final.
      7. O texto deve ter no MÍNIMO 4 parágrafos.
      8. Separe parágrafos com uma quebra de linha simples (\\n).

      Título original: ${title}
      Conteúdo original: ${content}

      Responda APENAS em formato JSON com a seguinte estrutura:
      {
        "titulo": "Novo título impactante",
        "resumo": "Um resumo de 2 frases para o card",
        "conteudo": "O texto completo da notícia formatado em parágrafos"
      }
    `;

    try {
      logger.info('ContentService', `Reformulando notícia via GROQ: ${title.substring(0, 30)}...`);
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error("Resposta vazia da Groq");

      return JSON.parse(response);
    } catch (error: any) {
      logger.error('ContentService', 'Erro ao reformular notícia na Groq, tentando Gemini...', error.message);
      
      // Fallback para Gemini em caso de erro na Groq
      try {
        const result = await textModel.generateContent(prompt + "\n\nIMPORTANTE: Responda apenas o JSON, sem blocos de código markdown.");
        const text = result.response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
      } catch (geminiError: any) {
        logger.error('ContentService', 'Falha total em ambos os modelos', geminiError.message);
        return null;
      }
    }
  },

  // Gerar prompt de imagem baseado no conteúdo
  async generateImagePrompt(title: string, summary: string) {
    try {
      logger.info('ContentService', 'Gerando prompt de imagem via Gemini...');
      
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
      logger.warn('ContentService', 'Gemini falhou no prompt de imagem, tentando Groq...', error.message);
      
      try {
        const prompt = `Create a detailed image generation prompt in English for a news article with title "${title}" and summary "${summary}". Style: photo-realistic, cinematic, editorial. Return only the prompt text.`;
        
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          max_tokens: 200
        });

        return completion.choices[0]?.message?.content?.trim() || "A professional newspaper editorial photography about news";
      } catch (groqError: any) {
        logger.error('ContentService', 'Falha total no prompt de imagem', groqError.message);
        return "A professional newspaper editorial photography about news";
      }
    }
  }
};
