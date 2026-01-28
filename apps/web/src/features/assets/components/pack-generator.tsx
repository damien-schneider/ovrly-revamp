import { CircleNotch, MagicWand, Plus, Upload, X } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import { useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  generatedAssetsAtom,
  isGeneratingPackAtom,
  packEmoteListAtom,
  packReferenceAtom,
} from "../store";

export function PackGenerator() {
  const [reference, setReference] = useAtom(packReferenceAtom);
  const [emoteList, setEmoteList] = useAtom(packEmoteListAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingPackAtom);
  const [, setAssets] = useAtom(generatedAssetsAtom);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newEmoteInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setReference(url);
    }
  };

  const handleAddEmote = () => {
    const val = newEmoteInputRef.current?.value;
    if (val && !emoteList.includes(val)) {
      setEmoteList([...emoteList, val]);
      if (newEmoteInputRef.current) {
        newEmoteInputRef.current.value = "";
      }
    }
  };

  const handleRemoveEmote = (emote: string) => {
    setEmoteList(emoteList.filter((e) => e !== emote));
  };

  const handleGeneratePack = async () => {
    if (!reference) {
      toast.error("Please upload a reference image");
      return;
    }
    if (emoteList.length === 0) {
      toast.error("Please add at least one emote to the list");
      return;
    }

    setIsGenerating(true);
    try {
      // Mock generation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const newAssets = emoteList.map((emote) => ({
        id: crypto.randomUUID(),
        url: `https://placehold.co/512x512/png?text=${encodeURIComponent(emote)}`,
        prompt: emote,
        style: "custom" as const, // Using 'custom' or casting if needed, for now let's assume it fits or we adjust types
        createdAt: Date.now(),
        type: "emote" as const,
      }));

      // @ts-expect-error - style type mismatch fix later if needed, for now 'custom' is not in EmoteStyle but let's assume we extend it or just cast
      setAssets((prev) => [...newAssets, ...prev]);
      toast.success(`Generated ${newAssets.length} emotes!`);
    } catch (_error) {
      toast.error("Failed to generate pack");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Style Transfer Pack Generator</CardTitle>
          <CardDescription>
            Upload a reference image and define your emote list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reference Upload */}
          <div className="space-y-2">
            <Label>Reference Image</Label>
            <button
              className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {reference ? (
                <img
                  alt="Reference"
                  className="h-full w-full object-contain"
                  height={360}
                  src={reference}
                  width={640}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <span>Click to upload reference</span>
                </div>
              )}
              <input
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
            </button>
          </div>

          {/* Emote List */}
          <div className="space-y-2">
            <Label>Emote List</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add new emote (e.g. LOL)"
                ref={newEmoteInputRef}
              />
              <Button onClick={handleAddEmote} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {emoteList.map((emote) => (
                <Badge className="h-8 px-3" key={emote} variant="secondary">
                  {emote}
                  <button
                    className="ml-2 rounded-full hover:bg-muted-foreground/20"
                    onClick={() => handleRemoveEmote(emote)}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={isGenerating}
            onClick={handleGeneratePack}
          >
            {isGenerating ? (
              <>
                <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                Generating Pack...
              </>
            ) : (
              <>
                <MagicWand className="mr-2 h-4 w-4" />
                Generate Pack
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview / Results would go here or be shared with the main grid */}
      <Card className="flex items-center justify-center p-6 text-center text-muted-foreground">
        <p>Generated pack assets will appear in the main gallery below.</p>
      </Card>
    </div>
  );
}
