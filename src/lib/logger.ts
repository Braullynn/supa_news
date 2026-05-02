import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar Service Role para logs internos

const supabase = createClient(supabaseUrl, supabaseKey);

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
  async log(level: LogLevel, process: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${process}]: ${message}`;
    
    // 1. Log no Console
    if (level === 'error') console.error(logEntry, data || '');
    else if (level === 'warn') console.warn(logEntry, data || '');
    else console.log(logEntry, data || '');

    // 2. Tentar persistir no Supabase (se a tabela existir)
    try {
      await supabase.from('logs_processo').insert([
        {
          level,
          processo: process,
          mensagem: message,
          detalhes: data ? JSON.stringify(data) : null,
          created_at: timestamp
        }
      ]);
    } catch (err) {
      console.error('Falha ao salvar log no Supabase:', err);
    }
  },

  info(process: string, message: string, data?: any) {
    return this.log('info', process, message, data);
  },

  error(process: string, message: string, data?: any) {
    return this.log('error', process, message, data);
  },

  warn(process: string, message: string, data?: any) {
    return this.log('warn', process, message, data);
  },

  debug(process: string, message: string, data?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      return this.log('debug', process, message, data);
    }
  }
};
