import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Trophy, Flame, Target, BookOpen, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { useSubjects } from '@/hooks/use-subjects';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // No orderBy — avoids composite index requirement. Sort client-side.
        const q = query(
          collection(db, 'study_sessions'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((doc) => {
            const d = doc.data();
            return { ...d, date: d.date?.toDate() || new Date() };
          })
          .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
        setSessions(data);
        setFetchError(null);
      } catch (err: any) {
        console.error('Analytics fetch error:', err);
        setFetchError(err.message ?? 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  // Compute Weekly Chart Data
  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  const weeklyData = last7Days.map(day => {
    const daySessions = sessions.filter(s => isSameDay(s.date, day));
    const totalMinutes = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    return {
      day: format(day, 'EEE'),
      fullDate: format(day, 'MMM d'),
      hours: +(totalMinutes / 60).toFixed(1)
    };
  });

  // Compute Subject Breakdown
  const subjectBreakdown = subjects.map(sub => {
    const subSessions = sessions.filter(s => s.subjectId === sub.id);
    const totalMinutes = subSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    return {
      name: sub.name,
      hours: +(totalMinutes / 60).toFixed(1),
      color: sub.color
    };
  }).filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours);

  const totalAllTimeHours = +(sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60).toFixed(1);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-semibold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your progress and study patterns over time.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Clock className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Study Time</p>
            <p className="text-3xl font-display font-semibold">{totalAllTimeHours}<span className="text-lg text-muted-foreground ml-1">hrs</span></p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center mb-4">
            <Flame className="text-success" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Streak</p>
            <p className="text-3xl font-display font-semibold">3<span className="text-lg text-muted-foreground ml-1">days</span></p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="text-accent" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</p>
            <p className="text-3xl font-display font-semibold">{sessions.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
            <Trophy className="text-warning" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Productivity</p>
            <p className="text-3xl font-display font-semibold text-warning">High</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="md:col-span-2 bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-sm">
          <h2 className="font-display font-semibold text-xl mb-6">Last 7 Days</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', backgroundColor: 'hsl(var(--card))' }}
                  labelStyle={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHours)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-sm">
          <h2 className="font-display font-semibold text-xl mb-6">Subject Breakdown</h2>
          
          {subjectBreakdown.length > 0 ? (
            <div className="space-y-5">
              {subjectBreakdown.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm text-foreground flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold">{item.hours}h</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.hours / totalAllTimeHours) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <BookOpen className="text-muted-foreground/30 mb-3" size={48} />
              <p className="text-sm text-muted-foreground">No subject data yet.<br/>Start a session to see breakdown.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}