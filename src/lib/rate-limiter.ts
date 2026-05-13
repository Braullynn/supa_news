
const executionLog: number[] = [];
const MAX_EXECUTIONS = 3; // Máximo 3 execuções por hora
const WINDOW_MS = 60 * 60 * 1000; // 1 hora

export function isRateLimited(): boolean {
  const now = Date.now();
  // Remove entradas antigas
  while (executionLog.length > 0 && executionLog[0] < now - WINDOW_MS) {
    executionLog.shift();
  }
  if (executionLog.length >= MAX_EXECUTIONS) {
    return true; // Bloqueado
  }
  executionLog.push(now);
  return false; // Permitido
}
