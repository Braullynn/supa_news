'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarSidebar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const router = useRouter();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/arquivo/${dateStr}`);
  };

  return (
    <div className="border border-black p-4 bg-white">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:bg-gray-100 p-1">
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-bold uppercase text-xs tracking-widest">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:bg-gray-100 p-1">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Espaçamento inicial para alinhar o primeiro dia do mês */}
        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {days.map((day) => (
          <button
            key={day.toString()}
            onClick={() => handleDateClick(day)}
            className={`
              h-7 w-7 text-[11px] flex items-center justify-center transition-colors
              ${isToday(day) ? 'bg-accent text-white font-bold' : 'hover:bg-black hover:text-white'}
              border border-transparent
            `}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h4 className="text-[10px] font-bold uppercase tracking-widest border-b border-black mb-2">Navegar por Tópicos</h4>
        <ul className="text-xs space-y-2">
          <li><button onClick={() => router.push('/tecnologia')} className="hover:underline italic">#tecnologia</button></li>
          <li><button onClick={() => router.push('/tendencias')} className="hover:underline italic">#tendencias</button></li>
          <li><button onClick={() => router.push('/saude')} className="hover:underline italic">#saude</button></li>
        </ul>
      </div>
    </div>
  );
}
