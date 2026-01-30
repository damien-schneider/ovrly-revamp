import type { Comment } from "reflet-sdk/react";
import { useComments, useFeedback } from "reflet-sdk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FeedbackCommentForm } from "./feedback-comment-form";
import { FeedbackStatusBadge } from "./feedback-status-badge";
import { FeedbackVoteButton } from "./feedback-vote-button";

interface FeedbackDetailProps {
  feedbackId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDetail({
  feedbackId,
  open,
  onOpenChange,
}: FeedbackDetailProps) {
  const { data: feedback, isLoading: isFeedbackLoading } = useFeedback(
    feedbackId ?? undefined
  );
  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch,
  } = useComments(feedbackId ?? undefined);

  if (!feedbackId) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        {isFeedbackLoading && (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        )}

        {!(isFeedbackLoading || feedback) && (
          <div className="py-8 text-center text-muted-foreground">
            Feedback not found
          </div>
        )}

        {!isFeedbackLoading && feedback && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <FeedbackVoteButton
                  feedbackId={feedback.id}
                  hasVoted={feedback.hasVoted}
                  voteCount={feedback.voteCount}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <DialogTitle className="text-lg">
                      {feedback.title}
                    </DialogTitle>
                    <FeedbackStatusBadge status={feedback.status} />
                  </div>
                  {feedback.tags.length > 0 && (
                    <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                      {feedback.tags[0].name}
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>

            {feedback.description && (
              <DialogDescription className="text-foreground">
                {feedback.description}
              </DialogDescription>
            )}

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium text-sm">
                Comments ({feedback.commentCount})
              </h4>

              <FeedbackCommentForm
                feedbackId={feedback.id}
                onSuccess={() => refetch()}
              />

              <ScrollArea className="max-h-64">
                {isCommentsLoading && (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    Loading comments...
                  </div>
                )}

                {!isCommentsLoading && comments && comments.length > 0 && (
                  <div className="space-y-4">
                    {comments.map((comment: Comment) => (
                      <div className="flex gap-3" key={comment.id}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author?.avatar} />
                          <AvatarFallback>
                            {comment.author?.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.author?.name ?? "Anonymous"}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{comment.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isCommentsLoading && (!comments || comments.length === 0) && (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
