import { NextResponse } from 'next/server';
import { NewsBot } from '@/services/news-bot';
import { logger } from '@/lib/logger';

export async function GET() {
  const PROCESS = 'API_EXECUTE';
  
  try {
    logger.info(PROCESS, 'Execução manual disparada via API');
    
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
