import { logger } from './logger';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

export const CloudflareAI = {
  async generateImage(prompt: string): Promise<Buffer | null> {
    const PROCESS = 'CloudflareAI';
    
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || CLOUDFLARE_ACCOUNT_ID.includes('COLE_AQUI')) {
      logger.error(PROCESS, 'Credenciais da Cloudflare não configuradas no .env');
      return null;
    }

    try {
      logger.info(PROCESS, 'Solicitando geração de imagem ao Workers AI...');

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro na API Cloudflare: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      // A API do Workers AI retorna os bytes da imagem diretamente
      const arrayBuffer = await response.arrayBuffer();
      logger.info(PROCESS, 'Imagem gerada com sucesso via Cloudflare');
      
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      logger.error(PROCESS, 'Falha ao gerar imagem na Cloudflare', error.message);
      return null;
    }
  }
};
