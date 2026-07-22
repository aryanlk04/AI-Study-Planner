import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Loader2, Save, ArrowRight, Calendar as CalendarIcon, Clock, Target } from 'lucide-react';
import { useAiGeneratePlan } from '@workspace/api-client-react';
import { useSubjects } from '@/hooks/use-subjects';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export default function AiPlannerPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const generatePlanMutation = useAiGeneratePlan();
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [examDate, setExamDate] = useState('');
  const [goals, setGoals] = useState('');
  
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Default to selecting all existing subjects
  useEffect(() => {
    if (subjects.length > 0 && selectedSubjects.length === 0) {
      setSelectedSubjects(subjects.map(s => s.name));
    }
  }, [subjects]);

  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectName) 
        ? prev.filter(s => s !== subjectName)
        : [...prev, subjectName]
    );
  };

  const handleGenerate = () => {
    if (selectedSubjects.length === 0 || !examDate) {
      alert("Please select at least one subject and set an exam date.");
      return;
    }

    generatePlanMutation.mutate({
      data: {
        subjects: selectedSubjects,
        availableHoursPerDay: hoursPerDay,
        examDate: new Date(examDate).toISOString(),
        ...(goals ? { goals } : {}),
        currentLevel: 'intermediate',
      }
    }, {
      onSuccess: (data) => {
        setGeneratedPlan(data);
      },
    });
  };

  const savePlanToFirestore = async () => {
    if (!user || !generatedPlan) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'planner'), {
        userId: user.uid,
        date: new Date(),
        planText: generatedPlan.plan,
        schedule: generatedPlan.schedule || [],
        generatedByAI: true,
        createdAt: serverTimestamp()
      });
      alert('Plan saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
          <Brain className="text-primary" size={32} />
          AI Study Planner
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Let AI analyze your timeline and create the perfect study curriculum to reach your goals.
        </p>
      </div>

      {!generatedPlan ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-sm"
        >
          <div className="space-y-8">
            
            {/* Subjects */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <BookOpen size={18} className="text-muted-foreground" />
                What are you studying?
              </label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.name)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      selectedSubjects.includes(subject.name)
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
                {subjects.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Add subjects in Settings to see them here.</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Hours */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-muted-foreground" />
                  Available hours per day
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="0.5"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <span className="font-display font-semibold text-xl w-12 text-right">
                    {hoursPerDay}h
                  </span>
                </div>
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon size={18} className="text-muted-foreground" />
                  Target Date / Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Target size={18} className="text-muted-foreground" />
                Specific Goals or Weaknesses (Optional)
              </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="E.g., I struggle with Calculus integration, but I am strong in Algebra. I want to achieve a top grade."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-h-[100px] resize-y"
              />
            </div>

            {generatePlanMutation.isError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" data-testid="ai-plan-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <p className="font-medium">Failed to generate plan</p>
                  <p className="mt-0.5 text-red-600 font-mono text-xs break-all">
                    {(generatePlanMutation.error as any)?.message ?? 'Server error — check that your OpenAI API key is correct in Replit Secrets.'}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generatePlanMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-xl font-medium text-lg hover:bg-primary transition-all duration-300 disabled:opacity-70 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              data-testid="button-generate-plan"
            >
              {generatePlanMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing curriculum...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Smart Plan
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
              <Sparkles className="text-primary" />
              Your Custom Plan
            </h2>
            <div className="flex gap-3">
              <button 
                onClick={() => setGeneratedPlan(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Regenerate
              </button>
              <button 
                onClick={savePlanToFirestore}
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-full font-medium shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save to Planner
              </button>
            </div>
          </div>

          <div className="bg-card border border-border p-8 rounded-[2rem] shadow-sm prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-a:text-primary">
            {/* Render markdown style plan. In a real app we'd use a markdown parser, but here we can just display it with basic formatting if it's plain text, or assume it's pre-formatted. */}
            <div dangerouslySetInnerHTML={{ __html: generatedPlan.plan.replace(/\n/g, '<br />') }} className="text-foreground leading-relaxed" />
            
            {generatedPlan.schedule && generatedPlan.schedule.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-display text-xl font-semibold mb-4">Recommended Schedule</h3>
                <div className="space-y-4">
                  {generatedPlan.schedule.map((day: any, i: number) => (
                    <div key={i} className="bg-secondary p-4 rounded-xl border border-border/50">
                      <h4 className="font-semibold mb-2 text-primary">{day.day}</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {day.tasks.map((task: string, j: number) => (
                          <li key={j} className="text-sm text-foreground/80">{task}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

import { BookOpen } from 'lucide-react';