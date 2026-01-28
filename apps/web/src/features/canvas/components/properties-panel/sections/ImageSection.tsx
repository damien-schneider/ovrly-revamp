import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ImageElement, OverlayElement } from "@/features/canvas/types";
import {
  CompactInput,
  getSliderValue,
  PanelSection,
  PropertyRow,
} from "../primitives";

interface ImageSectionProps {
  element: ImageElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function ImageSection({ element, onUpdate }: ImageSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdate(element.id, { src: dataUrl } as Partial<ImageElement>);
        toast.success("Image uploaded!");
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to upload image");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload image");
      setIsUploading(false);
    }
  };

  return (
    <PanelSection title="Image">
      <div className="space-y-2">
        <input
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          ref={fileInputRef}
          type="file"
        />
        <Button
          className="h-7 w-full gap-1.5 text-[11px]"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          <Upload className="h-3 w-3" />
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
        <CompactInput
          className="w-full"
          onChange={(v) =>
            onUpdate(element.id, { src: v } as Partial<ImageElement>)
          }
          type="text"
          value={element.src}
        />
        <PropertyRow label="Fit">
          <Select
            onValueChange={(v) =>
              onUpdate(element.id, {
                objectFit: v as "cover" | "contain" | "fill",
              } as Partial<ImageElement>)
            }
            value={element.objectFit}
          >
            <SelectTrigger className="h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="contain">Contain</SelectItem>
              <SelectItem value="fill">Fill</SelectItem>
            </SelectContent>
          </Select>
        </PropertyRow>
        <PropertyRow label="Radius">
          <div className="flex-1">
            <Slider
              max={100}
              min={0}
              onValueChange={(v) =>
                onUpdate(element.id, {
                  borderRadius: getSliderValue(v),
                } as Partial<ImageElement>)
              }
              value={[element.borderRadius ?? 0]}
            />
          </div>
        </PropertyRow>
      </div>
    </PanelSection>
  );
}
