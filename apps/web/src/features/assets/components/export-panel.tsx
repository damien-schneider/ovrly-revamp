import { DownloadSimple, FileZip } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import JSZip from "jszip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generatedAssetsAtom } from "../store";

// Helper to resize image
const resizeImage = (url: string, size: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob failed"));
      }, "image/png");
    };
    img.onerror = reject;
    img.src = url;
  });

export function ExportPanel() {
  const [assets] = useAtom(generatedAssetsAtom);

  const handleDownloadSingle = async (
    asset: { url: string; prompt: string },
    format: "png" | "zip"
  ) => {
    try {
      if (format === "png") {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${asset.prompt.replace(/\s+/g, "_")}_112.png`; // Default to largest size or original
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Downloaded PNG");
      } else {
        const zip = new JSZip();
        const sizes = [112, 56, 28];

        await Promise.all(
          sizes.map(async (size) => {
            const blob = await resizeImage(asset.url, size);
            zip.file(`${asset.prompt.replace(/\s+/g, "_")}_${size}.png`, blob);
          })
        );

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${asset.prompt.replace(/\s+/g, "_")}_pack.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Downloaded ZIP Pack");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to download");
    }
  };

  const handleDownloadBulk = async () => {
    if (assets.length === 0) {
      toast.error("No assets to download");
      return;
    }

    try {
      const zip = new JSZip();
      const sizes = [112, 56, 28];

      for (const asset of assets) {
        const folder = zip.folder(asset.prompt.replace(/\s+/g, "_"));
        if (folder) {
          await Promise.all(
            sizes.map(async (size) => {
              const blob = await resizeImage(asset.url, size);
              folder.file(
                `${asset.prompt.replace(/\s+/g, "_")}_${size}.png`,
                blob
              );
            })
          );
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emote_bundle_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Downloaded Bulk Bundle");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create bulk bundle");
    }
  };

  if (assets.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Assets</CardTitle>
        <CardDescription>
          Download your generated emotes in Twitch-ready sizes (112px, 56px,
          28px).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">
              All Assets ({assets.length})
            </h3>
            <Button onClick={handleDownloadBulk}>
              <FileZip className="mr-2 h-4 w-4" />
              Download All as ZIP
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <div
                className="flex items-center justify-between rounded-lg border p-3"
                key={asset.id}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    alt={asset.prompt}
                    className="h-10 w-10 rounded bg-muted"
                    src={asset.url}
                  />
                  <span className="truncate font-medium text-sm">
                    {asset.prompt}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleDownloadSingle(asset, "png")}
                    size="icon"
                    title="Download PNG"
                    variant="ghost"
                  >
                    <DownloadSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDownloadSingle(asset, "zip")}
                    size="icon"
                    title="Download ZIP Pack"
                    variant="ghost"
                  >
                    <FileZip className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
