import { cva, type VariantProps } from "class-variance-authority";
import type { FeedbackStatus } from "reflet-sdk/react";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs",
  {
    variants: {
      status: {
        open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        under_review:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        planned:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        in_progress:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        completed:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        closed:
          "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      },
    },
    defaultVariants: {
      status: "open",
    },
  }
);

const statusLabels: Record<FeedbackStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  closed: "Closed",
};

interface FeedbackStatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  status: FeedbackStatus;
  className?: string;
}

export function FeedbackStatusBadge({
  status,
  className,
}: FeedbackStatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {statusLabels[status]}
    </span>
  );
}
