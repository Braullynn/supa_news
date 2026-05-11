import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import CalendarSidebar from "@/components/CalendarSidebar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 3600; // Revalida a página a cada hora (ISR)

async function getNews() {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .order('data_publicacao', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Erro ao buscar notícias:', error);
    return [];
  }
  return data;
}

export default async function Home() {
  const news = await getNews();

  if (!news || news.length === 0) {
    return (
      <main className="min-h-screen pb-16">
        <Header />
        <div className="text-center py-20">
          <h2 className="text-2xl font-serif-news">Aguardando as primeiras notícias do dia...</h2>
          <p className="text-gray-500 mt-2">O bot está preparando o jornal de hoje.</p>
        </div>
      </main>
    );
  }

  const mainNews = news[0];
  const otherNews = news.slice(1);

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="newspaper-grid mt-8">
        {/* Notícia Principal */}
        <NewsCard
          id={mainNews.id}
          titulo={mainNews.titulo}
          resumo={mainNews.resumo}
          imagem_url={mainNews.imagem_url}
          categoria={mainNews.categoria}
          isMain
        />

        {/* Sidebar com Notícias em Alta e Calendário */}
        <aside className="col-span-12 lg:col-span-4 border-l border-gray-200 lg:pl-6 space-y-8">
          <CalendarSidebar />

          <div className="mb-8">
            <h3 className="text-xl font-bold uppercase tracking-tighter border-b-4 border-black mb-4">Em Alta</h3>
            <div className="flex flex-col gap-6">
              {otherNews.map((item) => (
                <div key={item.id} className="border-b border-gray-100 pb-4">
                  <span className="tag-category">{item.categoria}</span>
                  <Link href={`/noticia/${item.id}`}>
                    <h4 className="font-serif-news text-lg font-bold hover:underline">{item.titulo}</h4>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Notícias Secundárias (Fila Inferior - Visível em Mobile/Tablet) */}
        <div className="col-span-12 lg:hidden flex flex-col gap-8">
          {otherNews.map((item) => (
            <NewsCard
              key={item.id}
              id={item.id}
              titulo={item.titulo}
              resumo={item.resumo}
              imagem_url={item.imagem_url}
              categoria={item.categoria}
            />
          ))}
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t-2 border-black text-center text-xs font-bold uppercase tracking-widest">
        &copy; 2026 Supa News!
      </footer>
    </main>
  );
}
