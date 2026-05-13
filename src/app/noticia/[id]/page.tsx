import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

async function getArticle(id: string) {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: 'Notícia não encontrada' };

  return {
    title: `${article.titulo} | Supa News!`,
    description: article.resumo,
    openGraph: {
      title: article.titulo,
      description: article.resumo,
      images: [article.imagem_url],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <article className="max-w-4xl mx-auto mt-12">
        <div className="text-center mb-8">
          <span className="tag-category mb-4">{article.categoria}</span>
          <h1 className="text-4xl md:text-6xl font-serif-news font-bold leading-tight mb-6">
            {article.titulo}
          </h1>
          <p className="text-xl text-gray-600 italic font-serif-news max-w-2xl mx-auto">
            {article.resumo}
          </p>
        </div>

        <div className="news-divider"></div>

        <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest mb-8">
          <span>Fonte: {article.fonte_nome}</span>
          <span>{new Date(article.data_publicacao).toLocaleDateString('pt-BR')}</span>
        </div>

        {article.imagem_url && (
          <div className="relative aspect-video w-full mb-12 border border-black grayscale hover:grayscale-0 transition-all duration-700">
            <Image
              src={article.imagem_url}
              alt={article.titulo}
              fill
              sizes="(max-width: 1200px) 100vw, 80vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none font-serif-news text-gray-800 leading-relaxed space-y-6">
          {article.conteudo.split('\n').map((para: string, index: number) => (
            para.trim() && <p key={index}>{para}</p>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-black flex justify-between items-center">
          <a
            href={article.fonte_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-widest hover:underline"
          >
            &larr; Ler fonte original
          </a>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest hover:underline"
          >
            Voltar ao jornal
          </Link>
        </div>
      </article>

      <footer className="mt-16 pt-8 border-t-2 border-black text-center text-xs font-bold uppercase tracking-widest">
        &copy; 2026 Supa News!
      </footer>
    </main>
  );
}
