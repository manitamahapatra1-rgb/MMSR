import type { CourseInfo } from "@/types/course";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CourseSelectorProps {
  label: string;
  courses: CourseInfo[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  placeholder?: string;
}

export function CourseSelector({
  label,
  courses,
  selectedId,
  onSelect,
  placeholder = "Choose a course",
}: CourseSelectorProps) {
  const selected = courses.find((c) => c.id === selectedId);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <Select value={selectedId} onValueChange={onSelect}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.courseCode} — {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">
              {selected.courseCode}
            </span>
            <span className="text-slate-500">{selected.credits} credits</span>
          </div>
          <p className="mt-1 text-slate-600">{selected.school}</p>
          <p className="mt-2 line-clamp-3 text-slate-700">
            {selected.description}
          </p>
        </div>
      )}
    </div>
  );
}
