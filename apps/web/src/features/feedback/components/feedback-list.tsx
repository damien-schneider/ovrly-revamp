import { useState } from "react";
import type { FeedbackItem, FeedbackStatus } from "reflet-sdk/react";
import { useFeedbackList } from "reflet-sdk/react";
import { FeedbackCard } from "./feedback-card";
import { FeedbackDetail } from "./feedback-detail";
import { FeedbackFilterBar } from "./feedback-filter-bar";

export function FeedbackList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("votes");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useFeedbackList({
    search: search || undefined,
    status: status === "all" ? undefined : (status as FeedbackStatus),
    sortBy: sort as "votes" | "newest" | "oldest" | "comments",
  });

  const feedbackList = data?.items;

  return (
    <div className="space-y-4">
      <FeedbackFilterBar
        onSearchChange={setSearch}
        onSortChange={setSort}
        onStatusChange={setStatus}
        search={search}
        sort={sort}
        status={status}
      />

      {error && (
        <div className="py-8 text-center text-destructive">
          Failed to load feedback: {error.message}
        </div>
      )}

      {!error && isLoading && (
        <div className="py-8 text-center text-muted-foreground">
          Loading feedback...
        </div>
      )}

      {!(error || isLoading) && feedbackList && feedbackList.length > 0 && (
        <div className="grid gap-3">
          {feedbackList.map((feedback: FeedbackItem) => (
            <FeedbackCard
              feedback={feedback}
              key={feedback.id}
              onClick={() => setSelectedId(feedback.id)}
            />
          ))}
        </div>
      )}

      {!(error || isLoading) &&
        (!feedbackList || feedbackList.length === 0) && (
          <div className="py-8 text-center text-muted-foreground">
            No feedback found. Be the first to share your ideas!
          </div>
        )}

      <FeedbackDetail
        feedbackId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        open={!!selectedId}
      />
    </div>
  );
}
