import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usar Service Role para logs internos

const supabase = createClient(supabaseUrl, supabaseKey);

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitizeLogData(data: any): any {
  if (!data) return null;
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  // Remove padrões de chaves de API
  const sanitized = str
    .replace(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTED]')
    .replace(/AIzaSy[A-Za-z0-9_-]{30,}/g, '[GOOGLE_KEY_REDACTED]')
    .replace(/gsk_[A-Za-z0-9]{40,}/g, '[GROQ_KEY_REDACTED]')
    .replace(/sk-[A-Za-z0-9]{40,}/g, '[API_KEY_REDACTED]')
    .replace(/cf[au]t_[A-Za-z0-9_-]+/g, '[CLOUDFLARE_TOKEN_REDACTED]');
    
  return typeof data === 'string' ? sanitized : JSON.parse(sanitized);
}

export const logger = {
  async log(level: LogLevel, processName: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${processName}]: ${message}`;
    
    const sanitizedData = sanitizeLogData(data);

    // 1. Log no Console
    if (level === 'error') console.error(logEntry, sanitizedData || '');
    else if (level === 'warn') console.warn(logEntry, sanitizedData || '');
    else console.log(logEntry, sanitizedData || '');

    // 2. Tentar persistir no Supabase (se a tabela existir)
    try {
      await supabase.from('logs_processo').insert([
        {
          level,
          processo: processName,
          mensagem: message,
          detalhes: sanitizedData ? JSON.stringify(sanitizedData) : null,
          created_at: timestamp
        }
      ]);
    } catch (err) {
      console.error('Falha ao salvar log no Supabase:', err);
    }
  },

  info(processName: string, message: string, data?: any) {
    return this.log('info', processName, message, data);
  },

  error(processName: string, message: string, data?: any) {
    return this.log('error', processName, message, data);
  },

  warn(processName: string, message: string, data?: any) {
    return this.log('warn', processName, message, data);
  },

  debug(processName: string, message: string, data?: any) {
    if (globalThis.process?.env?.LOG_LEVEL === 'debug') {
      return this.log('debug', processName, message, data);
    }
  }
};
