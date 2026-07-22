import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  error: string;
  className?: string;
}

export function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}
      data-testid="error-message"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
      <span>{error}</span>
    </div>
  );
}

interface PageErrorProps {
  error: string;
  title?: string;
}

export function PageError({ error, title = 'Failed to load data' }: PageErrorProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <h3 className="font-semibold text-red-800 mb-1">{title}</h3>
        <p className="text-sm text-red-600 font-mono break-all">{error}</p>
        <p className="mt-3 text-xs text-red-500">
          If this says "Missing or insufficient permissions", open Firebase Console → Firestore → Rules and update your security rules.
        </p>
      </div>
    </div>
  );
}
