import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Brain, Sparkles, Layers, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { useFlashcards, Flashcard } from '@/hooks/use-flashcards';
import { useSubjects } from '@/hooks/use-subjects';
import { useAiGenerateFlashcards } from '@workspace/api-client-react';

export default function FlashcardsPage() {
  const { flashcards, loading, addFlashcard, updateReview, deleteFlashcard } = useFlashcards();
  const { subjects } = useSubjects();
  const generateMutation = useAiGenerateFlashcards();

  const [activeDeckSubject, setActiveDeckSubject] = useState<string>('all');
  const [isStudying, setIsStudying] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateCount, setGenerateCount] = useState(5);
  const [generateSubject, setGenerateSubject] = useState('');

  const filteredCards = flashcards.filter(c => 
    activeDeckSubject === 'all' ? true : c.subjectId === activeDeckSubject
  );

  const startStudying = () => {
    // Basic study logic: pick cards due for review or unrated, fallback to all filtered
    const now = new Date();
    let toStudy = filteredCards.filter(c => c.nextReviewDate <= now || c.difficulty === 'unrated');
    if (toStudy.length === 0) toStudy = [...filteredCards]; // If nothing due, study all
    
    // Shuffle
    toStudy.sort(() => Math.random() - 0.5);
    
    if (toStudy.length > 0) {
      setStudyQueue(toStudy);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsStudying(true);
    } else {
      alert("No cards available to study in this deck!");
    }
  };

  const handleRate = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const card = studyQueue[currentIndex];
    await updateReview(card.id, difficulty);
    
    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsStudying(false);
      alert("Deck finished!");
    }
  };

  const handleGenerateAI = async () => {
    if (!generateTopic) return;
    
    generateMutation.mutate({
      data: {
        topic: generateTopic,
        cardCount: generateCount,
      }
    }, {
      onSuccess: async (data) => {
        for (const card of data.flashcards) {
          await addFlashcard({
            deckId: 'default',
            subjectId: generateSubject || undefined,
            front: card.front,
            back: card.back
          });
        }
        setIsGenerating(false);
        setGenerateTopic('');
      }
    });
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  // --- Study Mode View ---
  if (isStudying && studyQueue.length > 0) {
    const card = studyQueue[currentIndex];
    return (
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col justify-center relative">
        <button 
          onClick={() => setIsStudying(false)}
          className="absolute top-0 left-0 p-2 text-muted-foreground hover:bg-secondary rounded-lg"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-muted-foreground">
            Card {currentIndex + 1} of {studyQueue.length}
          </p>
        </div>

        <div 
          className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-card border-2 border-border rounded-[2rem] shadow-md p-10 flex items-center justify-center text-center">
              <h3 className="text-2xl font-display font-medium text-foreground">{card.front}</h3>
            </div>
            
            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-primary text-primary-foreground rounded-[2rem] shadow-md p-10 flex items-center justify-center text-center" style={{ transform: "rotateY(180deg)" }}>
              <p className="text-xl font-medium leading-relaxed">{card.back}</p>
            </div>
          </motion.div>
        </div>

        {isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center gap-4 mt-12"
          >
            <button onClick={(e) => { e.stopPropagation(); handleRate('hard'); }} className="px-6 py-3 rounded-xl font-medium border border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors">
              Hard
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleRate('medium'); }} className="px-6 py-3 rounded-xl font-medium border border-warning text-warning hover:bg-warning hover:text-white transition-colors">
              Medium
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleRate('easy'); }} className="px-6 py-3 rounded-xl font-medium border border-success text-success hover:bg-success hover:text-white transition-colors">
              Easy
            </button>
          </motion.div>
        )}
        
        {!isFlipped && (
          <div className="text-center mt-12 text-muted-foreground animate-pulse">
            Click to flip
          </div>
        )}
      </div>
    );
  }

  // --- Deck View ---
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground flex items-center gap-3">
            <Layers className="text-primary" />
            Flashcards
          </h1>
          <p className="text-muted-foreground mt-1">Master your material with spaced repetition.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsGenerating(true)}
            className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2 rounded-xl font-medium hover:bg-secondary/80 transition-colors"
          >
            <Sparkles size={18} className="text-accent" />
            Generate with AI
          </button>
          <button 
            onClick={startStudying}
            disabled={filteredCards.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-sm"
          >
            <Brain size={18} />
            Study Now
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-accent/5 border border-accent/20 rounded-[2rem] p-6 mb-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2 text-accent">
                <Sparkles size={20} /> AI Flashcard Generator
              </h3>
              <button onClick={() => setIsGenerating(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Topic</label>
                <input 
                  type="text" 
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  placeholder="e.g., Mitosis rules, French irregular verbs, World War 2"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject</label>
                <select 
                  value={generateSubject}
                  onChange={(e) => setGenerateSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:border-accent"
                >
                  <option value="">No Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-between items-end mt-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Amount ({generateCount})</label>
                  <input 
                    type="range" min="1" max="20" 
                    value={generateCount} 
                    onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                    className="w-48 accent-accent"
                  />
                </div>
                <button 
                  onClick={handleGenerateAI}
                  disabled={generateMutation.isPending || !generateTopic}
                  className="bg-accent text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {generateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  Generate Cards
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deck Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setActiveDeckSubject('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeDeckSubject === 'all' ? 'bg-foreground text-background shadow-sm' : 'bg-card border border-border hover:bg-secondary'}`}
        >
          All Cards ({flashcards.length})
        </button>
        {subjects.map(s => {
          const count = flashcards.filter(c => c.subjectId === s.id).length;
          return (
            <button 
              key={s.id}
              onClick={() => setActiveDeckSubject(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border`}
              style={{
                backgroundColor: activeDeckSubject === s.id ? s.color : 'hsl(var(--card))',
                color: activeDeckSubject === s.id ? '#fff' : 'inherit',
                borderColor: activeDeckSubject === s.id ? s.color : 'hsl(var(--border))'
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeDeckSubject === s.id ? '#fff' : s.color }} />
              {s.name} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredCards.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-3xl">
            <Layers className="mx-auto text-muted-foreground mb-4" size={40} />
            <p className="text-muted-foreground font-medium">No flashcards found in this deck.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Generate some with AI or create them manually.</p>
          </div>
        ) : (
          filteredCards.map(card => (
            <div key={card.id} className="bg-card border border-border p-6 rounded-[1.5rem] shadow-sm relative group hover:shadow-md transition-shadow">
              <button 
                onClick={() => deleteFlashcard(card.id)}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
              <div className="mb-4">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Front</span>
                <p className="font-medium text-foreground mt-1 line-clamp-3">{card.front}</p>
              </div>
              <div className="pt-4 border-t border-border">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Back</span>
                <p className="text-sm text-foreground/80 mt-1 line-clamp-3">{card.back}</p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}