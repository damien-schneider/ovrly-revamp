import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangelogView } from "./changelog-view";
import { FeedbackForm } from "./feedback-form";
import { FeedbackList } from "./feedback-list";
import { RoadmapView } from "./roadmap-view";

export function FeedbackBoard() {
  return (
    <Tabs className="w-full" defaultValue="feedback">
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>
        <FeedbackForm />
      </div>

      <TabsContent className="mt-6" value="feedback">
        <FeedbackList />
      </TabsContent>

      <TabsContent className="mt-6" value="roadmap">
        <RoadmapView />
      </TabsContent>

      <TabsContent className="mt-6" value="changelog">
        <ChangelogView />
      </TabsContent>
    </Tabs>
  );
}
