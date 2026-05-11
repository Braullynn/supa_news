import { createClient } from '@supabase/supabase-js';
import Groq from "groq-sdk";

// Variáveis carregadas via --env-file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const groqKey = process.env.GROQ_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !groqKey) {
  console.error("❌ Erro: Faltam chaves no .env (Supabase ou Groq)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const groq = new Groq({ apiKey: groqKey });

async function fixImages() {
  console.log("🔍 Buscando notícias no banco de dados...");
  
  const { data: noticias, error } = await supabase
    .from('noticias')
    .select('id, titulo, resumo, categoria');

  if (error) {
    console.error("❌ Erro ao buscar notícias:", error.message);
    return;
  }

  console.log(`📸 Encontradas ${noticias.length} notícias. Iniciando correção de imagens...`);

  for (const noticia of noticias) {
    try {
      console.log(`\n⏳ Processando: "${noticia.titulo}"`);

      // 1. Gerar novo prompt de imagem via Groq (mais curto para evitar quebra de URL)
      const promptResult = await groq.chat.completions.create({
        messages: [{ 
          role: "user", 
          content: `Create a CONCISE (max 40 words) image generation prompt in English for: "${noticia.titulo}". Style: photo-realistic, editorial newspaper. Avoid commas at the end.` 
        }],
        model: "llama-3.3-70b-versatile",
        max_tokens: 60
      });

      let imagePrompt = promptResult.choices[0]?.message?.content?.trim() || "";
      // Limpeza de caracteres que podem quebrar a URL
      imagePrompt = imagePrompt.replace(/[?&,.]+$/, "").replace(/["']/g, "");
      
      const seed = Math.floor(Math.random() * 10000);
      const newImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1000&height=600&seed=${seed}&nologo=true`;

      // 2. Atualizar no Banco de Dados
      const { error: updateError } = await supabase
        .from('noticias')
        .update({ imagem_url: newImageUrl })
        .eq('id', noticia.id);

      if (updateError) throw updateError;

      console.log(`✅ Imagem atualizada com sucesso!`);

    } catch (err) {
      console.error(`❌ Falha ao processar "${noticia.titulo}":`, err.message);
    }
  }

  console.log("\n✨ Todas as imagens foram corrigidas! Reinicie o servidor para ver as mudanças.");
}

fixImages();
