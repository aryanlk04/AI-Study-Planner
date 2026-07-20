import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Save, Settings2, CheckCircle2, Target } from 'lucide-react';
import { useSubjects } from '@/hooks/use-subjects';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export default function PomodoroPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleSessionComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    if (!isBreak) {
      setSessionsCompleted(prev => prev + 1);
      
      // Save session to Firestore if subject selected
      if (user && selectedSubject) {
        try {
          await addDoc(collection(db, 'study_sessions'), {
            userId: user.uid,
            subjectId: selectedSubject,
            durationMinutes: workDuration,
            type: 'pomodoro',
            date: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to save session", e);
        }
      }
      
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      alert('Focus session complete! Time for a break.'); // Basic notification
    } else {
      setIsBreak(false);
      setTimeLeft(workDuration * 60);
      alert('Break complete! Back to work.');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft((isBreak ? breakDuration : workDuration) * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = (isBreak ? breakDuration : workDuration) * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      
      <div className="w-full flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Deep Work</h1>
          <p className="text-muted-foreground mt-1">Focus intensely, rest completely.</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-muted-foreground hover:bg-secondary rounded-xl transition-colors"
        >
          <Settings2 size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-card border border-border p-6 rounded-[2rem] shadow-sm mb-8 overflow-hidden"
          >
            <h3 className="font-display font-semibold mb-4 text-lg">Timer Settings</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Work Duration (min)</label>
                <input 
                  type="number" 
                  value={workDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setWorkDuration(val);
                    if (!isRunning && !isBreak) setTimeLeft(val * 60);
                  }}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Break Duration (min)</label>
                <input 
                  type="number" 
                  value={breakDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBreakDuration(val);
                    if (!isRunning && isBreak) setTimeLeft(val * 60);
                  }}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md bg-card border border-border rounded-[3rem] p-10 shadow-sm flex flex-col items-center">
        
        {/* Status Badge */}
        <div className={`px-4 py-1.5 rounded-full text-sm font-medium mb-8 transition-colors ${
          isBreak ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
        }`}>
          {isBreak ? 'Break Time' : 'Focus Session'}
        </div>

        {/* Circular Timer */}
        <div className="relative w-64 h-64 mb-10">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle 
              cx="50" cy="50" r="45" 
              fill="transparent" 
              stroke="hsl(var(--muted)/0.5)" 
              strokeWidth="2" 
            />
            {/* Progress track */}
            <circle 
              cx="50" cy="50" r="45" 
              fill="transparent" 
              stroke={isBreak ? "hsl(var(--success))" : "hsl(var(--primary))"}
              strokeWidth="4" 
              strokeLinecap="round"
              strokeDasharray={282.7}
              strokeDashoffset={282.7 - (282.7 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-display font-medium tracking-tight text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mb-8">
          <button 
            onClick={resetTimer}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`w-20 h-20 flex items-center justify-center rounded-full shadow-md hover:-translate-y-1 transition-all ${
              isRunning 
                ? 'bg-foreground text-background' 
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            onClick={() => {
              setIsRunning(false);
              setIsBreak(!isBreak);
              setTimeLeft((!isBreak ? breakDuration : workDuration) * 60);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <CheckCircle2 size={20} />
          </button>
        </div>

        {/* Subject Selection */}
        <div className="w-full">
          <label className="block text-center text-sm font-medium mb-2 text-muted-foreground">
            What are you working on?
          </label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isRunning}
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-center focus:outline-none focus:border-primary disabled:opacity-50 appearance-none"
          >
            <option value="">General Study (Uncategorized)</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

      </div>

      <div className="mt-8 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Target size={16} />
        Sessions completed today: <span className="text-foreground">{sessionsCompleted}</span>
      </div>

    </div>
  );
}