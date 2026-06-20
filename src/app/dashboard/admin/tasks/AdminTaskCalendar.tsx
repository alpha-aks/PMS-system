'use client';

import { useState } from 'react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday, addMonths, subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Props {
  tasks: any[];
  onAddClick: (date: Date) => void;
}

export default function AdminTaskCalendar({ tasks, onAddClick }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="glass-panel p-6 flex flex-col h-full bg-bg-dark border border-white/5 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-display text-text-primary">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-primary transition">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text-secondary transition">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-text-primary transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10 text-sm">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="bg-bg-dark/80 p-3 text-center font-semibold text-text-muted">
            {day}
          </div>
        ))}
        
        {daysInMonth.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          
          // Find tasks due on this day
          const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

          return (
            <div 
              key={i}
              className={`min-h-[100px] p-2 bg-bg-dark relative group transition hover:bg-white/[0.03] ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs ${isDayToday ? 'bg-accent-primary text-white font-bold' : 'text-text-secondary'}`}>
                  {format(day, 'd')}
                </span>
                <button 
                  onClick={() => onAddClick(day)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-text-muted hover:text-accent-primary transition-all"
                  title="Assign task for this date"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="mt-2 space-y-1">
                {dayTasks.map(t => (
                  <div key={t.id} className="text-[10px] px-1.5 py-0.5 rounded truncate bg-white/5 border border-white/10 text-text-secondary">
                    {t.user?.name?.split(' ')[0]}: {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
