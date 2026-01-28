import { ArrowRight, CircleNotch, MagicWand } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  activeTabAtom,
  creatorPromptAtom,
  creatorStyleAtom,
  type EmoteStyle,
  generatedAssetsAtom,
  isGeneratingAtom,
  packReferenceAtom,
} from "../store";

const STYLES: { value: EmoteStyle; label: string }[] = [
  { value: "cartoon", label: "Cartoon" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "realistic", label: "Realistic" },
  { value: "3d-render", label: "3D Render" },
  { value: "watercolor", label: "Watercolor" },
  { value: "sketch", label: "Sketch" },
  { value: "anime", label: "Anime" },
];

export function EmoteCreator() {
  const [prompt, setPrompt] = useAtom(creatorPromptAtom);
  const [style, setStyle] = useAtom(creatorStyleAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [assets, setAssets] = useAtom(generatedAssetsAtom);
  const [, setPackReference] = useAtom(packReferenceAtom);
  const [, setActiveTab] = useAtom(activeTabAtom);

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      // TODO: Replace with actual AI call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newAsset = {
        id: crypto.randomUUID(),
        url: `https://placehold.co/512x512/png?text=${encodeURIComponent(prompt)}`, // Mock image
        prompt,
        style,
        createdAt: Date.now(),
        type: "emote" as const,
      };

      setAssets((prev) => [newAsset, ...prev]);
      toast.success("Emote generated!");
    } catch (_error) {
      toast.error("Failed to generate emote");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseAsReference = (url: string) => {
    setPackReference(url);
    setActiveTab("pack");
    toast.success("Image set as reference for Pack Generator");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create New Emote</CardTitle>
          <CardDescription>
            Describe your emote and choose a style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., a happy banana wearing sunglasses"
              value={prompt}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select
              onValueChange={(v) => setStyle(v as EmoteStyle)}
              value={style}
            >
              <SelectTrigger id="style">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <MagicWand className="mr-2 h-4 w-4" />
                Generate Emote
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {assets.map((asset) => (
          <Card className="group relative overflow-hidden" key={asset.id}>
            <div className="relative aspect-square bg-muted/50">
              <img
                alt={asset.prompt}
                className="absolute inset-0 h-full w-full object-cover"
                height={512}
                src={asset.url}
                width={512}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  onClick={() => handleUseAsReference(asset.url)}
                  size="sm"
                  variant="secondary"
                >
                  Use as Reference
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="truncate font-medium text-sm">{asset.prompt}</p>
              <p className="text-muted-foreground text-xs capitalize">
                {asset.style}
              </p>
            </CardContent>
          </Card>
        ))}
        {assets.length === 0 && (
          <div className="col-span-full flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed text-muted-foreground">
            <p>Generated emotes will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
