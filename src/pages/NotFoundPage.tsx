import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-btn bg-slate-100 text-txt-muted">
        <FileQuestion className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-txt-primary">404 — Page Not Found</h1>
      <p className="text-xs text-txt-secondary max-w-sm">
        The requested screen could not be found.
      </p>
      <Button asChild size="sm" className="mt-2">
        <Link to="/dashboard">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </Button>
    </div>
  );
};
