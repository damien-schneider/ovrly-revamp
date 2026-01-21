import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationSidebar } from "@/features/canvas/components/NavigationSidebar";

function AssetsPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] font-sans text-gray-900">
      <NavigationSidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-gray-200 border-b bg-white px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="font-semibold text-lg">Assets & AI Generation</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl">
            <section className="mb-8">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Sub Badges Generator
              </h2>
              <p className="mb-6 text-gray-600">
                Use AI to generate custom subscriber badges for your Twitch
                channel. Describe your style and let AI create unique badges for
                each tier.
              </p>

              <div className="rounded-xl border border-gray-300 border-dashed bg-white p-8 text-center">
                <Wand2 className="mx-auto mb-4 h-12 w-12 text-purple-400" />
                <h3 className="mb-2 font-medium text-gray-900">
                  AI Badge Generator
                </h3>
                <p className="mb-4 text-gray-500 text-sm">
                  Coming soon - Generate custom subscriber badges with AI
                </p>
                <Button disabled variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Badges
                </Button>
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                Asset Library
              </h2>
              <p className="mb-6 text-gray-600">
                Upload and manage your overlay assets: images, icons, fonts, and
                more.
              </p>

              <div className="rounded-xl border border-gray-300 border-dashed bg-white p-8 text-center">
                <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 font-medium text-gray-900">
                  Upload Assets
                </h3>
                <p className="mb-4 text-gray-500 text-sm">
                  Drag and drop files or click to upload
                </p>
                <Button disabled variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/assets")({
  component: AssetsPage,
});
