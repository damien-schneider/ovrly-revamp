import { createFileRoute, redirect } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmoteCreator } from "@/features/assets/components/emote-creator";
import { ExportPanel } from "@/features/assets/components/export-panel";
import { MagicEditor } from "@/features/assets/components/magic-editor";
import { PackGenerator } from "@/features/assets/components/pack-generator";

export const Route = createFileRoute("/(with_navbar)/assets/emotes")({
  beforeLoad: ({ context, location }) => {
    const userId = (context as { userId?: string }).userId;
    if (!userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: RouteComponent,
});

import { useAtom } from "jotai";
import { activeTabAtom } from "@/features/assets/store";

function RouteComponent() {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">
          EmoteGen Nano Banana
        </h1>
        <p className="text-muted-foreground">
          Create, style, and manage your channel emotes.
        </p>
      </div>

      <Tabs
        className="w-full space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="creator">Creator</TabsTrigger>
          <TabsTrigger value="pack">Pack Gen</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="creator">
          <EmoteCreator />
        </TabsContent>

        <TabsContent className="space-y-6" value="pack">
          <PackGenerator />
        </TabsContent>

        <TabsContent className="space-y-6" value="editor">
          <MagicEditor />
        </TabsContent>
      </Tabs>

      <ExportPanel />
    </div>
  );
}
