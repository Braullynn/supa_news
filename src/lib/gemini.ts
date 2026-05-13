import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Modelo para texto
export const textModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

// Modelo para imagem (se disponível via SDK) ou usaremos fetch direto se necessário
export const imageModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" }); 
