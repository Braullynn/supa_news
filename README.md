# 📰 Supa News! - Jornal Digital Automatizado

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-DB-3ECF8E?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)
![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Pro-blue?style=for-the-badge&logo=google-gemini)
![Groq](https://img.shields.io/badge/Groq-Llama%203-orange?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.7-blue?style=for-the-badge)

O **Supa News!** é um portal de notícias totalmente autônomo e inteligente. Utilizando o poder das IAs generativas, o sistema rastreia, reformula, valida e publica notícias diariamente, garantindo conteúdo original, profissional e livre de plágio.

## 🚀 Como funciona?
1.  **Rastreamento:** O robô busca as notícias mais relevantes através da GNews API e RSS Feeds.
2.  **Reformulação (Rewrite):** Utiliza LLMs (Groq/Gemini) para transformar o texto original em uma narrativa única no estilo editorial.
3.  **Validação & Qualidade:** Um motor de sanitização limpa o lixo digital (HTML/Markdown) e um validador garante que o texto esteja gramaticalmente correto e bem estruturado.
4.  **Imagens Cinematográficas:** Gera prompts artísticos e utiliza o Cloudflare Workers AI para criar imagens fotorealistas exclusivas para cada matéria.
5.  **Publicação:** Tudo é persistido no Supabase e exibido em um frontend moderno com estética de jornal clássico.

## 🛠️ Tecnologias
- **Frontend:** Next.js 15+ (App Router) & Tailwind CSS
- **Backend:** Next.js API Routes & Vercel Cron Jobs
- **Banco de Dados:** Supabase (PostgreSQL)
- **IA:** Gemini Pro, Groq (Llama 3.3) & Cloudflare AI
- **Estilização:** Tipografia clássica (Olde English, Playfair Display)

## 🌐 Deploy
O projeto está publicado e em pleno funcionamento na Vercel:

👉 **[Acesse o Supa News!](https://supa-news.vercel.app/)**

---
*Desenvolvido como um experimento de automação de conteúdo e engenharia de prompts.*
