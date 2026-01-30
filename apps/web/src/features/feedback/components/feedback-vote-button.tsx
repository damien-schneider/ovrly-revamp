import { CaretUp } from "@phosphor-icons/react";
import { useVote } from "reflet-sdk/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedbackVoteButtonProps {
  feedbackId: string;
  voteCount: number;
  hasVoted: boolean;
  className?: string;
}

export function FeedbackVoteButton({
  feedbackId,
  voteCount,
  hasVoted,
  className,
}: FeedbackVoteButtonProps) {
  const { mutate: vote, isLoading } = useVote();

  const handleVote = async () => {
    try {
      await vote({ feedbackId });
    } catch {
      // Error handled by SDK
    }
  };

  return (
    <Button
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1",
        hasVoted && "bg-primary/10 text-primary",
        className
      )}
      disabled={isLoading}
      onClick={handleVote}
      size="sm"
      variant={hasVoted ? "secondary" : "outline"}
    >
      <CaretUp className="h-4 w-4" weight={hasVoted ? "fill" : "regular"} />
      <span className="font-medium text-xs">{voteCount}</span>
    </Button>
  );
}
