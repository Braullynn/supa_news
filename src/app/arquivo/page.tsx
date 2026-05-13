import Header from "@/components/Header";
import CalendarSidebar from "@/components/CalendarSidebar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export const revalidate = 60; // Arquivo pode atualizar com mais frequência se houver muitas postagens

async function getArchiveNews(page: number = 1) {
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('noticias')
    .select('*', { count: 'exact' })
    .order('data_publicacao', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Erro ao buscar arquivo:', error);
    return { news: [], total: 0 };
  }
  return { news: data || [], total: count || 0 };
}

export default async function ArquivoPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const { news, total } = await getArchiveNews(currentPage);
  const totalPages = Math.ceil(total / 20);

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="mt-8 border-b-2 border-black pb-2 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Acervo Digital</h2>
        <h1 className="text-3xl font-serif-news font-bold">Arquivo de Matérias</h1>
      </div>

      <div className="newspaper-grid">
        <div className="col-span-12 lg:col-span-8">
          <div className="flex flex-col space-y-6">
            {news.length > 0 ? (
              <>
                {news.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 pb-6 group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {new Date(item.data_publicacao).toLocaleDateString('pt-BR')} | {item.categoria}
                      </span>
                    </div>
                    <Link href={`/noticia/${item.id}`}>
                      <h3 className="text-2xl font-serif-news font-bold group-hover:underline mb-2 leading-tight">
                        {item.titulo}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm italic">
                      {item.resumo}
                    </p>
                  </div>
                ))}

                {/* Paginação */}
                <div className="flex justify-between items-center pt-8">
                  {currentPage > 1 ? (
                    <Link 
                      href={`/arquivo?page=${currentPage - 1}`}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      <ChevronLeft size={16} /> Anterior
                    </Link>
                  ) : <div></div>}

                  <span className="text-xs font-serif-news italic">
                    Página {currentPage} de {totalPages || 1}
                  </span>

                  {currentPage < totalPages ? (
                    <Link 
                      href={`/arquivo?page=${currentPage + 1}`}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:underline"
                    >
                      Próxima <ChevronRight size={16} />
                    </Link>
                  ) : <div></div>}
                </div>
              </>
            ) : (
              <div className="py-20 text-center border border-dashed border-gray-300">
                <p className="italic text-gray-500 font-serif-news">O arquivo está vazio no momento.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4 lg:pl-6">
          <CalendarSidebar />
        </aside>
      </div>

      <footer className="mt-16 pt-8 border-t-2 border-black text-center text-xs font-bold uppercase tracking-widest">
        &copy; 2026 Supa News!
      </footer>
    </main>
  );
}
