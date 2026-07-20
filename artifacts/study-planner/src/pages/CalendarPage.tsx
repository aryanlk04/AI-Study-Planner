import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, Clock } from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { useSubjects } from '@/hooks/use-subjects';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { tasks } = useTasks();
  const { subjects } = useSubjects();

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Get tasks for this day
      const dayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate, cloneDay));
      
      days.push(
        <div
          key={day.toString()}
          className={`min-h-[120px] p-2 border-r border-b border-border transition-colors hover:bg-secondary/30 ${
            !isSameMonth(day, monthStart)
              ? "bg-secondary/50 text-muted-foreground"
              : isSameDay(day, new Date())
              ? "bg-primary/5 font-medium"
              : "bg-card text-foreground"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''}`}>
              {formattedDate}
            </span>
          </div>
          
          <div className="mt-2 flex flex-col gap-1.5 overflow-hidden">
            {dayTasks.slice(0, 3).map(task => {
              const subject = subjects.find(s => s.id === task.subjectId);
              return (
                <div 
                  key={task.id} 
                  className={`text-xs px-2 py-1 rounded-md truncate border ${task.status === 'done' ? 'opacity-50 line-through' : ''}`}
                  style={{
                    backgroundColor: subject ? `${subject.color}15` : 'hsl(var(--secondary))',
                    borderColor: subject ? `${subject.color}30` : 'hsl(var(--border))',
                    color: subject ? subject.color : 'hsl(var(--foreground))'
                  }}
                >
                  {task.title}
                </div>
              );
            })}
            {dayTasks.length > 3 && (
              <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                +{dayTasks.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-4rem)] pb-8">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule and track your upcoming tasks.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-1 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-display font-medium min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border bg-secondary shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {rows}
        </div>
      </div>
    </div>
  );
}