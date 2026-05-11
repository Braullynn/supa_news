import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testImageGeneration() {
  const prompt = "A professional cinematic newspaper editorial photograph of a futuristic city with flying cars and tall skyscrapers, high detail, 8k resolution";
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1000&height=600&seed=${seed}&nologo=true`;

  console.log(`🚀 Testando geração de imagem...`);
  console.log(`🔗 URL gerada: ${url}`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Falha na requisição: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(`📄 Tipo de conteúdo recebido: ${contentType}`);

    if (!contentType || !contentType.includes('image')) {
      const text = await response.text();
      console.error('❌ Erro: O recurso retornado não é uma imagem!');
      console.error('Resposta do servidor:', text.substring(0, 200));
      return;
    }

    const buffer = await response.arrayBuffer();
    const filePath = path.join(__dirname, 'test-image.jpg');
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    console.log(`✅ Sucesso! Imagem baixada e salva em: ${filePath}`);
    console.log(`💡 Se você consegue abrir este arquivo, o serviço de imagem está funcionando.`);

  } catch (error) {
    console.error('❌ Erro crítico no teste de imagem:', error.message);
  }
}

testImageGeneration();
