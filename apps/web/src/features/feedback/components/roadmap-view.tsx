import type { RoadmapItem, RoadmapLane } from "reflet-sdk/react";
import { useRoadmap } from "reflet-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoadmapView() {
  const { data: roadmap, isLoading } = useRoadmap();

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading roadmap...
      </div>
    );
  }

  if (!roadmap?.lanes?.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No roadmap items yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roadmap.lanes.map((lane: RoadmapLane) => (
        <div className="space-y-3" key={lane.id}>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: lane.color }}
            />
            <h3 className="font-semibold">{lane.name}</h3>
          </div>

          <div className="space-y-2">
            {lane.items.length ? (
              lane.items.map((item: RoadmapItem) => (
                <Card key={item.id} size="sm">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <span className="text-muted-foreground text-xs">
                      {item.voteCount} votes
                    </span>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
