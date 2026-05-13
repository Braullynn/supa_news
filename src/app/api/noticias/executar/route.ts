import { NextRequest, NextResponse } from 'next/server';
import { NewsBot } from '@/services/news-bot';
import { logger } from '@/lib/logger';
import { isRateLimited } from '@/lib/rate-limiter';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const PROCESS = 'API_EXECUTE';
  
  // 1. Rate Limiting
  if (isRateLimited()) {
    logger.warn(PROCESS, 'Rate limit atingido para execução da pipeline');
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  // 2. Autenticação
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-cron-secret'); // Para Vercel Cron

  if (authHeader !== `Bearer ${CRON_SECRET}` && cronHeader !== CRON_SECRET) {
    logger.warn(PROCESS, 'Tentativa de acesso não autorizada', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info(PROCESS, 'Execução autorizada disparada via API');
    
    // Executa a pipeline do bot
    const result = await NewsBot.runPipeline();

    if (result.success) {
      return NextResponse.json({ 
        message: 'Pipeline executada com sucesso!',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        message: 'Erro ao executar pipeline',
        error: result.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    logger.error(PROCESS, 'Falha crítica no endpoint de execução', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
