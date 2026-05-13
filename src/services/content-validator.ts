
interface ValidationResult {
  approved: boolean;
  issues: string[];
}

export function validateQuality(titulo: string, resumo: string, conteudo: string): ValidationResult {
  const issues: string[] = [];

  // 1. Tamanho mínimo do conteúdo (evita artigos "vazios")
  if (conteudo.length < 300) {
    issues.push(`Conteúdo muito curto: ${conteudo.length} chars (mínimo: 300)`);
  }

  // 2. Título não pode estar vazio ou ser genérico
  if (titulo.length < 10) {
    issues.push('Título muito curto ou vazio');
  }

  // 3. Detectar idioma estrangeiro predominante (palavras comuns em EN/ES)
  const foreignWords = conteudo.match(/\b(the|and|for|with|this|that|from|have|will|el|los|las|por|una|como)\b/gi);
  const wordCount = (conteudo.split(/\s+/).length) || 1;
  if (foreignWords && foreignWords.length > wordCount * 0.15) {
    issues.push(`Possível idioma estrangeiro detectado (${foreignWords.length} palavras suspeitas)`);
  }

  // 4. Detectar frases desconexas (frase que termina abruptamente sem pontuação final)
  const paragraphs = conteudo.split('\n').filter(p => p.trim().length > 0);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length > 20 && !/[.!?…"]$/.test(trimmed)) {
      issues.push(`Parágrafo sem pontuação final: "${trimmed.substring(0, 50)}..."`);
    }
  }

  // 5. Detectar tags HTML residuais que escaparam da sanitização
  if (/<[^>]+>/.test(conteudo) || /<[^>]+>/.test(titulo)) {
    issues.push('Tags HTML detectadas no conteúdo');
  }

  // 6. Repetição excessiva (mesma frase aparece 2+ vezes)
  const sentences = conteudo.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 15);
  const seen = new Set<string>();
  for (const sentence of sentences) {
    if (seen.has(sentence)) {
      issues.push(`Frase repetida detectada: "${sentence.substring(0, 40)}..."`);
      break;
    }
    seen.add(sentence);
  }

  return {
    approved: issues.length === 0,
    issues
  };
}
