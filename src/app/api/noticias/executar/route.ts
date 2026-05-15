import { NextRequest, NextResponse } from 'next/server';
import { NewsBot } from '@/services/news-bot';
import { logger } from '@/lib/logger';
import { isRateLimited } from '@/lib/rate-limiter';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const PROCESS = 'API_EXECUTE';
  const CRON_SECRET = process.env.CRON_SECRET;
  
  // 1. Rate Limiting
  if (isRateLimited()) {
    logger.warn(PROCESS, 'Rate limit atingido para execução da pipeline');
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  // 2. Autenticação
  const authHeader = request.headers.get('authorization');
  const isValid = authHeader === `Bearer ${CRON_SECRET}`;

  if (!isValid) {
    logger.warn(PROCESS, 'Tentativa de acesso não autorizada', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info(PROCESS, 'Execução autorizada disparada via API');
    
    // Captura data customizada da query string (se houver)
    const { searchParams } = new URL(request.url);
    const customDate = searchParams.get('date') || undefined;

    // Executa a pipeline do bot
    const result = await NewsBot.runPipeline(customDate);

    if (result.success) {
      // Força a atualização da Home Page e do Arquivo
      revalidatePath('/');
      revalidatePath('/arquivo');
      
      return NextResponse.json({ 
        message: `Pipeline executada com sucesso${customDate ? ' para ' + customDate : ''} e cache revalidado!`,
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
