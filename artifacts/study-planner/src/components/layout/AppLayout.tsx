import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Calendar,
  BrainCircuit,
  CheckSquare,
  Timer,
  BookOpen,
  Layers,
  TrendingUp,
  BarChart2,
  Settings,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'AI Planner', href: '/ai-planner', icon: BrainCircuit },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Pomodoro', href: '/pomodoro', icon: Timer },
  { name: 'Notes', href: '/notes', icon: BookOpen },
  { name: 'Flashcards', href: '/flashcards', icon: Layers },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
];

const bottomNav: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setLocation('/');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const NavLinks = ({ items }: { items: NavItem[] }) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        return (
          <li key={item.name}>
            <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <span
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                    : 'text-secondary-foreground hover:bg-secondary hover:text-primary'
                }`}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <Icon size={20} className={isActive ? 'text-primary-foreground' : 'text-accent'} />
                {item.name}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard">
            <span className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen size={18} className="text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-xl tracking-tight text-foreground">
                StudyAI
              </span>
            </span>
          </Link>
          <button className="md:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-hide">
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Study
            </div>
            <NavLinks items={mainNav} />
          </div>
        </div>

        <div className="p-4 mt-auto border-t border-border">
          <NavLinks items={bottomNav} />
          <button
            onClick={handleSignOut}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            data-testid="nav-signout"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">StudyAI</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-foreground">
            <Menu size={24} />
          </button>
        </header>
        
        <div className="flex-1 overflow-auto bg-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
