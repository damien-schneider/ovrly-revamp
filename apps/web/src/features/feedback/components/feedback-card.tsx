import type { FeedbackItem } from "reflet-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FeedbackStatusBadge } from "./feedback-status-badge";
import { FeedbackVoteButton } from "./feedback-vote-button";

interface FeedbackCardProps {
  feedback: FeedbackItem;
  onClick?: () => void;
  className?: string;
}

export function FeedbackCard({
  feedback,
  onClick,
  className,
}: FeedbackCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        className
      )}
      onClick={onClick}
      size="sm"
    >
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <FeedbackVoteButton
          feedbackId={feedback.id}
          hasVoted={feedback.hasVoted}
          voteCount={feedback.voteCount}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2">{feedback.title}</CardTitle>
            <FeedbackStatusBadge status={feedback.status} />
          </div>
          {feedback.description && (
            <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
              {feedback.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-muted-foreground text-xs">
          {feedback.tags.length > 0 && (
            <span className="rounded bg-muted px-1.5 py-0.5">
              {feedback.tags[0].name}
            </span>
          )}
          <span>{feedback.commentCount} comments</span>
          <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
