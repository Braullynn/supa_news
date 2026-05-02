import Image from 'next/image';
import Link from 'next/link';

interface NewsCardProps {
  id: string;
  titulo: string;
  resumo: string;
  imagem_url?: string;
  categoria: string;
  isMain?: boolean;
}

export default function NewsCard({ id, titulo, resumo, imagem_url, categoria, isMain }: NewsCardProps) {
  return (
    <article className={`${isMain ? 'col-span-12 lg:col-span-8' : 'col-span-12 sm:col-span-6 lg:col-span-4'} flex flex-col`}>
      <Link href={`/noticia/${id}`} className="group cursor-pointer">
        <span className="tag-category">{categoria}</span>
        
        {imagem_url && (
          <div className="relative aspect-video w-full mb-4 overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-black">
            <Image 
              src={imagem_url} 
              alt={titulo} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <h2 className={`${isMain ? 'text-4xl lg:text-5xl' : 'text-2xl'} font-serif-news font-bold leading-tight mb-3 group-hover:underline`}>
          {titulo}
        </h2>
        
        <p className="text-gray-700 leading-relaxed text-sm mb-4">
          {resumo}
        </p>
      </Link>
      
      {!isMain && <div className="border-t border-gray-200 mt-auto pt-4 mb-8"></div>}
    </article>
  );
}
