import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X, Play, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";

interface VideoGalleryProps {
  videos: Array<{ id?: string; url: string; thumbnail?: string }>;
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function VideoGallery({ videos, isLoading = false, onDelete }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const handleDownload = async (videoUrl: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kaikus-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {videos.map((video, index) => (
          <Card key={index} className="overflow-hidden group relative">
            <div className="relative aspect-video bg-muted">
              {video.thumbnail ? (
                <Image
                  src={video.thumbnail}
                  alt={`Video thumbnail ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzIxMjEyMSIvPjwvc3ZnPg=="
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setSelectedVideo(video.url)}
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => handleDownload(video.url)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {onDelete && video.id && (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => onDelete(video.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedVideo && (
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-auto"
                style={{ maxHeight: "80vh" }}
              >
                Your browser does not support the video tag.
              </video>
            )}
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={() => selectedVideo && handleDownload(selectedVideo)}
                className="bg-primary/90 hover:bg-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Stáhnout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}