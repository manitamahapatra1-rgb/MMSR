import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingResult() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

interface ErrorResultProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorResult({
  message = "We couldn't compare these two courses. Try again.",
  onRetry,
}: ErrorResultProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="h-6 w-6 text-red-600" />
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
