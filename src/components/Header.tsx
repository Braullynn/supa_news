import Link from 'next/link';

export default function Header() {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="py-8">
      {/* Top Bar com Data e Tradução */}
      <div className="flex justify-between items-center border-b border-black pb-2 mb-4 text-[12px] uppercase font-bold tracking-widest">
        <span>{currentDate}</span>
        <div id="google_translate_element" className="translate-widget"></div>
      </div>

      {/* Main Logo */}
      <div className="text-center">
        <Link href="/">
          <h1 className="text-7xl md:text-9xl font-old-english inline-block hover:opacity-80 transition-opacity">
            Supa News!
          </h1>
        </Link>
      </div>

      {/* Navigation / Secondary Info */}
      <div className="news-divider"></div>
      <div className="flex justify-center gap-8 py-2 text-[13px] font-bold uppercase tracking-widest">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/tecnologia" className="hover:underline">Tecnologia</Link>
        <Link href="/tendencias" className="hover:underline">Tendências</Link>
        <Link href="/arquivo" className="hover:underline">Arquivo</Link>
      </div>
      <div className="news-divider"></div>
    </header>
  );
}
