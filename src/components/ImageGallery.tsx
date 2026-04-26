import { useState } from "react";
import { Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { GeneratedImage } from "@/services/imageGenerationService";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: GeneratedImage[];
  onDelete: (id: string) => void;
}

export function ImageGallery({ images, onDelete }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prompt.slice(0, 30)}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Zatím jste nevygenerovali žádné obrázky</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <div className="aspect-square relative overflow-hidden bg-muted">
              <img
                src={image.image_url}
                alt={image.prompt}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm line-clamp-2 font-medium">{image.prompt}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {image.provider}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image.image_url, image.prompt);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(image.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              <img
                src={selectedImage.image_url}
                alt={selectedImage.prompt}
                className="w-full h-auto rounded-lg"
              />
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-heading font-bold text-lg mb-2">Prompt</h3>
                  <p className="text-muted-foreground">{selectedImage.prompt}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary">{selectedImage.provider}</Badge>
                    <Badge variant="outline">{selectedImage.size}</Badge>
                  </div>
                  <Button
                    onClick={() => handleDownload(selectedImage.image_url, selectedImage.prompt)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Stáhnout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}