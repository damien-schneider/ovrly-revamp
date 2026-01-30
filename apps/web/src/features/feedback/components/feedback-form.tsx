import { useState } from "react";
import { useCreateFeedback } from "reflet-sdk/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { mutate: createFeedback, isLoading } = useCreateFeedback();

  const resetForm = () => {
    setTitle("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    try {
      await createFeedback({
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Feedback submitted");
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button />}>New Feedback</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
            <DialogDescription>
              Share your ideas, report bugs, or request features.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                disabled={isLoading}
                id="title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback"
                value={title}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                disabled={isLoading}
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details about your feedback"
                rows={4}
                value={description}
              />
            </div>
          </div>

          <DialogFooter>
            <Button disabled={isLoading} type="submit">
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
