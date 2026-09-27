import type { Coverage } from "@/types/course";
import { Check, CircleDot, X } from "lucide-react";

const STYLES: Record<Coverage, string> = {
  covered: "bg-emerald-50 text-emerald-800 border-emerald-200",
  partial: "bg-amber-50 text-amber-800 border-amber-200",
  missing: "bg-red-50 text-red-800 border-red-200",
};

const ICONS: Record<Coverage, React.ReactNode> = {
  covered: <Check className="h-3.5 w-3.5" />,
  partial: <CircleDot className="h-3.5 w-3.5" />,
  missing: <X className="h-3.5 w-3.5" />,
};

interface TopicPillProps {
  topic: string;
  coverage: Coverage;
  evidence?: string;
}

export function TopicPill({ topic, coverage, evidence }: TopicPillProps) {
  return (
    <div
      title={evidence}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${STYLES[coverage]}`}
    >
      {ICONS[coverage]}
      <span>{topic}</span>
    </div>
  );
}
