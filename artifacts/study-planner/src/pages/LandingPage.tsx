import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { BookOpen, Target, Brain, Calendar, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import heroImg from '@assets/generated_images/hero-desk.jpg';

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <BookOpen size={22} className="text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-2xl tracking-tight">StudyAI</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="text-secondary-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <button className="bg-foreground text-background px-6 py-2.5 rounded-full hover:bg-primary transition-all duration-300 hover:-translate-y-0.5 shadow-sm">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 max-w-7xl mx-auto relative">
        <motion.div 
          className="grid lg:grid-cols-2 gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-2xl relative z-10">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-medium text-secondary-foreground">Your intelligent study companion</span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="font-display text-5xl lg:text-7xl font-semibold leading-[1.1] tracking-tight mb-6 text-foreground">
              Study Smarter, <br/>
              <span className="text-primary relative">
                Achieve More.
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Plan your studies, stay profoundly focused, and let AI build the perfect curriculum to help you achieve your goals without the burnout.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setLocation('/signup')} className="group flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium text-lg hover:bg-primary/90 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                Start for free
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button onClick={() => setLocation('/login')} className="flex items-center justify-center gap-2 bg-card border border-border text-foreground px-8 py-4 rounded-full font-medium text-lg hover:bg-secondary transition-all duration-300">
                View Demo
              </button>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] transform rotate-3 scale-105 blur-lg"></div>
            <div className="relative rounded-[2rem] overflow-hidden border-8 border-card shadow-2xl bg-card">
              <div className="aspect-[4/3] bg-muted relative">
                {/* Fallback pattern while image generates/loads */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-foreground to-transparent bg-[length:24px_24px]"></div>
                <img 
                  src={heroImg} 
                  alt="Premium Study Desk" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1200';
                  }}
                />
              </div>
            </div>
            
            {/* Floating UI Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -left-8 top-12 bg-card p-4 rounded-2xl shadow-lg border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                <Target className="text-success" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Daily Goal</p>
                <p className="font-display font-semibold text-lg">Completed!</p>
              </div>
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute -right-8 bottom-12 bg-card p-4 rounded-2xl shadow-lg border border-border flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Brain className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">AI Plan</p>
                <p className="font-display font-semibold text-lg">Generated</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-semibold mb-6">Designed for Deep Work</h2>
            <p className="text-lg text-muted-foreground">Everything you need to organize your curriculum, stay focused, and retain information efficiently.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI Curriculum Planner',
                desc: 'Give StudyAI your subjects and exam dates. It builds a realistic, day-by-day plan tailored to your available hours.'
              },
              {
                icon: Clock,
                title: 'Integrated Pomodoro',
                desc: 'Built-in deep work timers directly connected to your tasks. Track exactly how much focused time goes into each subject.'
              },
              {
                icon: Target,
                title: 'Smart Flashcards',
                desc: 'Let AI generate flashcards from your notes, then review them with spaced repetition algorithms built in.'
              },
              {
                icon: Calendar,
                title: 'Time Blocking',
                desc: 'Drag and drop your tasks into your calendar. A visual schedule ensures you know exactly what to do and when.'
              },
              {
                icon: BookOpen,
                title: 'Rich Notes',
                desc: 'A distraction-free editor for your class notes with one-click AI summarization for quick reviews before exams.'
              },
              {
                icon: TrendingUp,
                title: 'Beautiful Analytics',
                desc: 'Visualize your progress with elegant charts. See your study streaks, subject breakdowns, and productivity score.'
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-background p-8 rounded-3xl border border-border hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="text-primary group-hover:text-primary-foreground transition-colors" size={28} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
            <BookOpen size={20} className="text-primary" />
            <span className="font-display font-medium text-lg">StudyAI</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} StudyAI. Crafted with intention.
          </p>
        </div>
      </footer>
    </div>
  );
}
