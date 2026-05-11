import { GoogleGenerativeAI } from "@google/generative-ai";

// Pegando a chave do .env via processo (usaremos --env-file no comando)
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Erro: NEXT_PUBLIC_GEMINI_API_KEY não encontrada.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("🔍 Consultando a API do Google para listar modelos permitidos...");
    
    // Usando o endpoint de listagem oficial (via fetch direto para garantir que pegamos tudo)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    console.log("\n| Modelo (Name) | Display Name | Capabilities |");
    console.log("| :--- | :--- | :--- |");

    data.models.forEach(m => {
      // Filtrar apenas modelos que suportam geração de conteúdo
      if (m.supportedGenerationMethods.includes("generateContent")) {
         console.log(`| ${m.name.replace('models/', '')} | ${m.displayName} | ${m.supportedGenerationMethods.join(', ')} |`);
      }
    });

    console.log("\n✅ Lista obtida com sucesso.");

  } catch (err) {
    console.error("❌ Erro ao consultar modelos:", err.message);
  }
}

listModels();
