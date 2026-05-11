import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import CalendarSidebar from "@/components/CalendarSidebar";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const revalidate = 3600;

async function getNewsByDate(dateStr: string) {
  // Define o início e o fim do dia para o filtro
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .gte('data_publicacao', startOfDay)
    .lte('data_publicacao', endOfDay)
    .order('data_publicacao', { ascending: false });

  if (error) return [];
  return data;
}

export default async function ArchivePage({ params }: { params: { date: string } }) {
  const news = await getNewsByDate(params.date);
  const formattedDate = format(parseISO(params.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="mt-8 border-b-2 border-black pb-2 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Arquivo de Notícias</h2>
        <h1 className="text-3xl font-serif-news font-bold">{formattedDate}</h1>
      </div>

      <div className="newspaper-grid">
        <div className="col-span-12 lg:col-span-8">
          {news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {news.map((item) => (
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
          ) : (
            <div className="py-20 text-center border border-dashed border-gray-300">
              <p className="italic text-gray-500 font-serif-news">Não foram encontradas notícias para esta data.</p>
            </div>
          )}
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
