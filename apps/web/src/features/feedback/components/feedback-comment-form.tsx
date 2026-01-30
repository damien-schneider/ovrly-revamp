import { useState } from "react";
import { useAddComment } from "reflet-sdk/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackCommentFormProps {
  feedbackId: string;
  onSuccess?: () => void;
}

export function FeedbackCommentForm({
  feedbackId,
  onSuccess,
}: FeedbackCommentFormProps) {
  const [body, setBody] = useState("");
  const { mutate: addComment, isLoading } = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!body.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      await addComment({
        feedbackId,
        body: body.trim(),
      });
      setBody("");
      toast.success("Comment added");
      onSuccess?.();
    } catch {
      toast.error("Failed to add comment");
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Textarea
        disabled={isLoading}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        value={body}
      />
      <div className="flex justify-end">
        <Button disabled={isLoading || !body.trim()} size="sm" type="submit">
          {isLoading ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
