import Link from "next/link";
import type { Lesson } from "@/types";
import { cn, formatDuration, levelColor, statusColor } from "@/lib/utils";
import { Clock, CheckCircle2, PlayCircle, Circle } from "lucide-react";

const STATUS_ICON = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: PlayCircle,
  NOT_STARTED: Circle,
};

export default function LessonCard({ lesson }: { lesson: Lesson }) {
  const StatusIcon = STATUS_ICON[lesson.userStatus ?? "NOT_STARTED"];

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-primary-100 to-indigo-200 flex items-center justify-center">
        {lesson.thumbnailUrl ? (
          <img
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">🎧</span>
        )}
        {lesson.durationSeconds && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
            <Clock size={11} />
            {formatDuration(lesson.durationSeconds)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 line-clamp-2">
            {lesson.title}
          </h3>
          <StatusIcon
            size={16}
            className={cn("shrink-0 mt-0.5", statusColor(lesson.userStatus))}
          />
        </div>

        {lesson.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{lesson.description}</p>
        )}

        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", levelColor(lesson.level))}>
            {lesson.level === "BEGINNER" ? "Cơ bản" : lesson.level === "INTERMEDIATE" ? "Trung cấp" : "Nâng cao"}
          </span>
          {lesson.topic && (
            <span className="text-xs text-gray-400">{lesson.topic}</span>
          )}
        </div>

        {lesson.userBestScore != null && lesson.userBestScore > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <div
                className="h-1.5 bg-primary-500 rounded-full"
                style={{ width: `${lesson.userBestScore}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{lesson.userBestScore.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </Link>
  );
}
