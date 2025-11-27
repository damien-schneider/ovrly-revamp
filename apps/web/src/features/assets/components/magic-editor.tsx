import { CircleNotch, Eraser } from "@phosphor-icons/react";
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
  editorImageAtom,
  editorInstructionAtom,
  generatedAssetsAtom,
  isEditingAtom,
} from "../store";

export function MagicEditor() {
  const [selectedImage, setSelectedImage] = useAtom(editorImageAtom);
  const [instruction, setInstruction] = useAtom(editorInstructionAtom);
  const [isEditing, setIsEditing] = useAtom(isEditingAtom);
  const [assets, setAssets] = useAtom(generatedAssetsAtom);

  const handleEdit = async () => {
    if (!selectedImage) {
      toast.error("Please select an image to edit");
      return;
    }
    if (!instruction) {
      toast.error("Please enter an instruction");
      return;
    }

    setIsEditing(true);
    try {
      // Mock editing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For mock purposes, we just duplicate the image with a new ID
      const originalAsset = assets.find((a) => a.url === selectedImage);
      if (originalAsset) {
        const newAsset = {
          ...originalAsset,
          id: crypto.randomUUID(),
          prompt: `${originalAsset.prompt} (Edited: ${instruction})`,
          createdAt: Date.now(),
        };
        setAssets((prev) => [newAsset, ...prev]);
        toast.success("Image edited successfully!");
      }
    } catch (error) {
      toast.error("Failed to edit image");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Magic Editor</CardTitle>
          <CardDescription>
            Select an image and describe how to change it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Selected Image</Label>
            <div className="mx-auto flex aspect-square w-full max-w-[300px] items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
              {selectedImage ? (
                <img
                  alt="To edit"
                  className="h-full w-full object-cover"
                  src={selectedImage}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Select an image from your generated assets below</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instruction">Instruction</Label>
            <Input
              id="instruction"
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., make the banana blue, remove the sunglasses"
              value={instruction}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={isEditing || !selectedImage}
            onClick={handleEdit}
          >
            {isEditing ? (
              <>
                <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                Editing...
              </>
            ) : (
              <>
                <Eraser className="mr-2 h-4 w-4" />
                Apply Magic Edit
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <Label>Select Asset to Edit</Label>
        <div className="grid max-h-[500px] grid-cols-3 gap-2 overflow-y-auto p-1">
          {assets.map((asset) => (
            <div
              className={`aspect-square cursor-pointer overflow-hidden rounded-lg border-2 ${selectedImage === asset.url ? "border-primary" : "border-transparent"}`}
              key={asset.id}
              onClick={() => setSelectedImage(asset.url)}
            >
              <img
                alt={asset.prompt}
                className="h-full w-full object-cover"
                src={asset.url}
              />
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              No assets generated yet. Go to Creator or Pack Gen first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
