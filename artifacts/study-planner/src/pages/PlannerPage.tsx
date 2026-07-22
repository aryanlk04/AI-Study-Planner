import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Brain, Calendar, CheckSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function PlannerPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // No orderBy — avoids composite index requirement. Sort client-side.
        const q = query(
          collection(db, 'planner'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
            const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
            return bTime - aTime;
          })
          .slice(0, 5);
        setPlans(data);
      } catch (err: any) {
        console.error('PlannerPage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, [user]);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
            <Calendar className="text-primary" size={32} />
            My Planner
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Your saved AI study plans and curriculum schedules.
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-[2rem] text-center shadow-sm">
          <Brain className="mx-auto text-muted-foreground mb-4" size={48} />
          <h3 className="text-xl font-display font-semibold mb-2">No Plans Yet</h3>
          <p className="text-muted-foreground mb-6">Head over to the AI Planner to generate your first custom study curriculum.</p>
          <a href="/ai-planner" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5">
            Generate Plan
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {plans.map((plan, idx) => (
            <div key={plan.id} className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
              <div className="bg-secondary/50 px-8 py-4 border-b border-border flex justify-between items-center">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Brain size={18} className="text-primary" />
                  AI Generated Plan
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.createdAt?.toDate ? format(plan.createdAt.toDate(), 'MMMM d, yyyy') : 'Recently'}
                </span>
              </div>
              <div className="p-8">
                {plan.schedule && plan.schedule.length > 0 ? (
                  <div className="space-y-6">
                    {plan.schedule.map((day: any, i: number) => (
                      <div key={i}>
                        <h4 className="font-semibold text-primary font-display text-lg mb-3">{day.day}</h4>
                        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                          {day.tasks.map((task: string, j: number) => (
                            <div key={j} className="flex items-start gap-3">
                              <CheckSquare size={16} className="text-muted-foreground mt-1 shrink-0" />
                              <span className="text-foreground/90">{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: plan.planText.replace(/\n/g, '<br />') }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}