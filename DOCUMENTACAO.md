# 📑 Documentação Técnica - Supa News!

Este documento serve como a **Fonte Única de Verdade (Single Source of Truth)** para o projeto Supa News!. Ele deve ser fornecido a qualquer IA no início de uma nova sessão para garantir continuidade de contexto e economia de tokens.

---

## 🎯 Visão Geral
O **Supa News!** é um jornal digital totalmente automatizado. Ele utiliza IA para rastrear notícias, reformular o conteúdo para garantir originalidade e gerar imagens ilustrativas, publicando tudo de forma autônoma em um portal moderno.

### Tech Stack
- **Framework:** Next.js 16+ (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** Supabase (PostgreSQL)
- **IA de Texto/Processamento:** (a escolha do admin)
- **IA de Imagem:** Cloudflare Workers AI (SDXL) com Fallback Pollinations (modelo flux)
- **Armazenamento:** Supabase Storage (Bucket: noticias-imagens)
- **Estilização:** Tailwind CSS (Estilo editorial/jornalístico)
- **APIs de Notícias:** GNews API & Google News RSS

---

## 🏗️ Arquitetura de Pastas (Esquema do Projeto)

```text
src/
├── app/                    # Rotas e Páginas (Next.js App Router)
│   ├── api/                # Endpoints de Backend
│   │   └── noticias/
│   │       └── executar/   # Rota que dispara o Bot manual (GET)
│   ├── noticia/            # [slug] Página de detalhe da notícia
│   └── page.tsx            # Home Page (Jornal)
├── components/             # Componentes de UI (Header, NewsCard, Sidebar)
├── lib/                    # Configurações de Clientes (Supabase, Gemini, Logger)
└── services/               # Lógica de Negócio (O Coração do Projeto)
    ├── news-bot.ts         # Orquestrador da Pipeline
    ├── news-service.ts     # Integração com APIs de notícias
    └── content-service.ts  # Integração com Gemini (Rewrite & Prompts)
```

---

## 🗄️ Esquema do Banco de Dados (Supabase)

### Tabela: `noticias`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Chave primária (auto-gerada) |
| `titulo` | TEXT | Título reformulado pela IA |
| `conteudo` | TEXT | Texto completo da notícia |
| `resumo` | TEXT | Resumo de 2 frases para o card |
| `imagem_url` | TEXT | URL da imagem gerada pela IA |
| `categoria` | TEXT | Tecnologia, Tendências, etc. |
| `fonte_nome` | TEXT | Nome do portal original (ex: G1, TechCrunch) |
| `fonte_url` | TEXT | Link original para referência |
| `data_publicacao`| TIMESTAMPTZ | Data de criação (default: now) |
| `slug` | TEXT | URL amigável (única) |

### Tabela: `logs_processo`
- Armazena logs de execução do bot para debug e histórico.
- Campos: `id`, `level` (info/error), `processo`, `mensagem`, `detalhes` (JSONB), `created_at`.

---

## 🤖 Fluxo de Funcionamento (Pipeline)

O `NewsBot.runPipeline()` executa os seguintes passos:
1.  **Fetch:** Busca notícias Tech (via GNews) e Trending (via RSS).
2.  **Selection:** Filtra os artigos mais relevantes.
3.  **Rewrite:** Envia o título e descrição para o Gemini transformar em um texto original e profissional no estilo "Supa News!".
4.  **Imagery:** 
    - O Gemini gera um prompt de imagem em inglês.
    - O bot consome uma API de imagem com lógica de **Retry**.
    - Se falhar, usa um placeholder estético baseado na categoria.
5.  **Persistence:** Salva a notícia e os logs no Supabase.

---

## 🔑 Variáveis de Ambiente (.env)
- `NEXT_PUBLIC_GEMINI_API_KEY`: Chave do Google AI Studio.
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anon do Supabase (para o cliente).
- `SUPABASE_SERVICE_ROLE_KEY`: Chave administrativa (para logs e escrita).
- `GNEWS_API_KEY`: Chave para busca de notícias.

---

## 🚀 Comandos Úteis
- `npm run dev`: Inicia o ambiente de desenvolvimento.
- `GET /api/noticias/executar`: Dispara o bot manualmente.


