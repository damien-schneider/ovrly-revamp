import { createFileRoute } from "@tanstack/react-router";
import { FeedbackBoard } from "@/features/feedback/components/feedback-board";

export const Route = createFileRoute("/(with_navbar)/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      <div>
        <h1 className="font-bold text-3xl">Feedback</h1>
        <p className="mt-2 text-muted-foreground">
          Share your ideas and vote on features
        </p>
      </div>
      <FeedbackBoard />
    </div>
  );
}
