
export function sanitizeContent(text: string): string {
  if (!text) return '';
  let clean = text;

  // 1. Remover TODAS as tags HTML residuais (<br>, <p>, <strong>, etc.)
  clean = clean.replace(/<[^>]*>/g, '');

  // 2. Remover entidades HTML (&nbsp;, &amp;, etc.)
  clean = clean.replace(/&[a-z]+;/gi, ' ');
  clean = clean.replace(/&#\d+;/g, ' ');

  // 3. Remover markdown residual (**, ##, etc.)
  clean = clean.replace(/[*#_~`]/g, '');

  // 4. Normalizar espaços (múltiplos espaços -> um só)
  clean = clean.replace(/\s{2,}/g, ' ');

  // 5. Normalizar quebras de linha (máximo 2 consecutivas)
  clean = clean.replace(/\n{3,}/g, '\n\n');

  // 6. Remover espaços antes de pontuação
  clean = clean.replace(/\s+([.,;:!?])/g, '$1');

  // 7. Garantir espaço depois de pontuação
  clean = clean.replace(/([.,;:!?])([A-ZÀ-Ú])/g, '$1 $2');

  return clean.trim();
}
