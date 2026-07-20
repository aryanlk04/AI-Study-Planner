import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnimatePresence } from 'framer-motion';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import AiPlannerPage from '@/pages/AiPlannerPage';
import TasksPage from '@/pages/TasksPage';
import NotesPage from '@/pages/NotesPage';
import PomodoroPage from '@/pages/PomodoroPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import ProgressPage from '@/pages/ProgressPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import CalendarPage from '@/pages/CalendarPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import PlannerPage from '@/pages/PlannerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        
        {/* Protected Routes inside AppLayout */}
        <Route path="/dashboard">
          <ProtectedRoute component={() => <AppLayout><DashboardPage /></AppLayout>} />
        </Route>
        <Route path="/planner">
          <ProtectedRoute component={() => <AppLayout><PlannerPage /></AppLayout>} />
        </Route>
        <Route path="/ai-planner">
          <ProtectedRoute component={() => <AppLayout><AiPlannerPage /></AppLayout>} />
        </Route>
        <Route path="/tasks">
          <ProtectedRoute component={() => <AppLayout><TasksPage /></AppLayout>} />
        </Route>
        <Route path="/calendar">
          <ProtectedRoute component={() => <AppLayout><CalendarPage /></AppLayout>} />
        </Route>
        <Route path="/pomodoro">
          <ProtectedRoute component={() => <AppLayout><PomodoroPage /></AppLayout>} />
        </Route>
        <Route path="/notes">
          <ProtectedRoute component={() => <AppLayout><NotesPage /></AppLayout>} />
        </Route>
        <Route path="/flashcards">
          <ProtectedRoute component={() => <AppLayout><FlashcardsPage /></AppLayout>} />
        </Route>
        <Route path="/progress">
          <ProtectedRoute component={() => <AppLayout><ProgressPage /></AppLayout>} />
        </Route>
        <Route path="/analytics">
          <ProtectedRoute component={() => <AppLayout><AnalyticsPage /></AppLayout>} />
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={() => <AppLayout><SettingsPage /></AppLayout>} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={() => <AppLayout><ProfilePage /></AppLayout>} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
