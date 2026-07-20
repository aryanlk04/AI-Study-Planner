# StudyAI — Premium Study AI Planner

A full-featured, premium study planning web application with AI assistance, Firebase auth/database, and a rich multi-page dashboard.

## Run & Operate

- `pnpm --filter @workspace/study-planner run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the AI API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Lucide React
- Auth & DB: Firebase Auth + Firestore + Storage
- AI Backend: Express 5, OpenAI (gpt-4o-mini)
- API codegen: Orval (OpenAPI → React Query hooks + Zod schemas)

## Where things live

- `artifacts/study-planner/src/` — React frontend
  - `src/firebase/` — Firebase init and helpers (config, auth, firestore)
  - `src/contexts/AuthContext.tsx` — Auth state & ProtectedRoute
  - `src/pages/` — All page components (Landing, Dashboard, Planner, etc.)
  - `src/components/layout/` — AppLayout, Sidebar, Navbar
  - `src/hooks/` — Custom Firebase data hooks
- `artifacts/api-server/src/routes/ai.ts` — AI endpoints (OpenAI proxy)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/src/generated/` — Generated React Query hooks

## Firebase Setup Required

### 1. Authorized Domains (for Auth)
In Firebase Console → Authentication → Settings → Authorized domains:
Add your Replit dev domain: `*.replit.dev` or the specific domain shown in the preview URL.

### 2. Firestore Security Rules
In Firebase Console → Firestore → Rules, set:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /analytics/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Enable Auth Providers
In Firebase Console → Authentication → Sign-in method:
- Enable Email/Password
- Enable Google

### 4. Create Firestore Database
In Firebase Console → Firestore Database → Create database (start in test mode, then apply rules above)

## Environment Variables

- `VITE_FIREBASE_*` — Firebase config (set as env vars)
- `OPENAI_API_KEY` — OpenAI key for AI features

## Pages

| Route | Page |
|-------|------|
| / | Landing |
| /login | Login |
| /signup | Sign Up |
| /dashboard | Dashboard |
| /planner | Study Planner |
| /ai-planner | AI Plan Generator |
| /tasks | Task Manager |
| /calendar | Calendar |
| /pomodoro | Pomodoro Timer |
| /notes | Notes |
| /flashcards | Flashcards |
| /progress | Progress Tracker |
| /analytics | Analytics |
| /settings | Settings |
| /profile | Profile |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
