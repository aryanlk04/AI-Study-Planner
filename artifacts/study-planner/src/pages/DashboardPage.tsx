import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageError } from '@/components/ErrorMessage';
import { Link } from 'wouter';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Target,
  ChevronRight,
  Plus,
  Brain
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/use-tasks';
import { useSubjects } from '@/hooks/use-subjects';
import { format, isToday } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock chart data since we don't have analytics hook yet
const weeklyData = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.8 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 4.2 },
  { day: 'Fri', hours: 2.1 },
  { day: 'Sat', hours: 5.5 },
  { day: 'Sun', hours: 3.0 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { subjects } = useSubjects();
  
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const todayTasks = tasks.filter(t => t.dueDate && isToday(t.dueDate) && t.status !== 'done');
  const upcomingTasks = tasks.filter(t => t.status !== 'done').slice(0, 3);
  
  // Calculate daily progress (mock goal of 4 hours)
  const todayStudyHours = 2.5; 
  const dailyGoalHours = 4;
  const progressPercent = Math.min(100, (todayStudyHours / dailyGoalHours) * 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (tasksLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (tasksError) {
    return <PageError error={tasksError} title="Failed to load dashboard" />;
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8 pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
            {greeting}, {user?.displayName?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM do')} • You have {todayTasks.length} tasks due today.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex gap-3">
          <Link href="/pomodoro">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5">
              <Play size={18} fill="currentColor" />
              Start Focus Session
            </button>
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Main Stats & Tasks) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Daily Progress */}
            <motion.div variants={itemVariants} className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm flex items-center gap-6 group hover:shadow-md transition-shadow">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                    className="text-primary transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold font-display">{Math.round(progressPercent)}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-muted-foreground font-medium text-sm mb-1">Today's Study Time</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-semibold text-foreground">{todayStudyHours}h</span>
                  <span className="text-sm text-muted-foreground">/ {dailyGoalHours}h goal</span>
                </div>
              </div>
            </motion.div>

            {/* Productivity Score */}
            <motion.div variants={itemVariants} className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-center group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="text-success" size={20} />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-success/10 text-success rounded-full">Top 15%</span>
              </div>
              <div>
                <h3 className="text-muted-foreground font-medium text-sm mb-1">Productivity Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-semibold text-foreground">84</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Weekly Chart */}
          <motion.div variants={itemVariants} className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg">Study Hours (This Week)</h2>
              <Link href="/analytics" className="text-sm text-primary font-medium hover:text-primary/80 flex items-center">
                View detailed <ChevronRight size={16} />
              </Link>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 6, 6]}>
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.day === 'Thu' ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.3)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>

        {/* Right Column (Upcoming & AI) */}
        <div className="space-y-6">
          
          {/* Upcoming Tasks */}
          <motion.div variants={itemVariants} className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <CheckSquare className="text-muted-foreground" size={20} />
                Up Next
              </h2>
              <Link href="/tasks" className="p-1 text-muted-foreground hover:bg-secondary rounded-lg transition-colors">
                <Plus size={20} />
              </Link>
            </div>

            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map(task => {
                  const subject = subjects.find(s => s.id === task.subjectId);
                  return (
                    <div key={task.id} className="group flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border">
                      <div className="mt-0.5">
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary transition-colors"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {subject && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }}></span>
                              {subject.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span className={isToday(task.dueDate) ? 'text-warning font-medium' : ''}>
                                {isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM d')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="text-muted-foreground" size={24} />
                </div>
                <p className="text-sm text-muted-foreground">No upcoming tasks.</p>
                <Link href="/tasks" className="text-sm text-primary font-medium mt-2 inline-block hover:underline">
                  Add a task
                </Link>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm">
            <h2 className="font-display font-semibold text-lg mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/ai-planner">
                <div className="bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 p-4 rounded-xl text-center transition-colors cursor-pointer group">
                  <Brain className="mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-sm font-medium text-foreground">AI Plan</span>
                </div>
              </Link>
              <Link href="/notes">
                <div className="bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 p-4 rounded-xl text-center transition-colors cursor-pointer group">
                  <BookOpen className="mx-auto mb-2 text-accent group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-sm font-medium text-foreground">New Note</span>
                </div>
              </Link>
            </div>
          </motion.div>
          
        </div>
      </div>
    </motion.div>
  );
}

// Ensure CheckSquare is imported
import { CheckSquare } from 'lucide-react';