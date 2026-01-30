import type { ChangelogEntry } from "reflet-sdk/react";
import { useChangelog } from "reflet-sdk/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ChangelogView() {
  const { data: changelog, isLoading } = useChangelog();

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading changelog...
      </div>
    );
  }

  if (!changelog?.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No changelog entries yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {changelog.map((entry: ChangelogEntry) => (
        <Card key={entry.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{entry.title}</CardTitle>
                {entry.publishedAt && (
                  <CardDescription>
                    {new Date(entry.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                )}
              </div>
              {entry.version && (
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary text-xs">
                  v{entry.version}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {entry.description && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {entry.description}
              </div>
            )}
            {entry.feedback?.length ? (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 font-medium text-muted-foreground text-xs uppercase">
                  Related Feedback
                </p>
                <div className="flex flex-wrap gap-2">
                  {entry.feedback.map((item) => (
                    <span
                      className="rounded bg-muted px-2 py-1 text-sm"
                      key={item.id}
                    >
                      {item.title}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
