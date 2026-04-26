import { useState } from "react";
import { Download, Trash2, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GeneratedVideo } from "@/services/videoGenerationService";

interface VideoGalleryProps {
  videos: GeneratedVideo[];
  onDelete: (id: string) => void;
}

export function VideoGallery({ videos, onDelete }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  const handleDownload = (video: GeneratedVideo) => {
    if (video.video_url) {
      const link = document.createElement("a");
      link.href = video.video_url;
      link.download = `video-${video.id}.mp4`;
      link.click();
    }
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      "runwayml": "RunwayML",
      "pika": "Pika Labs",
      "stability-video": "Stability AI",
    };
    return labels[provider] || provider;
  };

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Žádná videa</h3>
        <p className="text-muted-foreground">
          Začněte generováním svého prvního videa pomocí AI
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div 
                className="relative aspect-video bg-muted cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/60 transition-colors">
                  <Play className="h-12 w-12 text-white" />
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary" className="bg-black/70 text-white">
                    {video.duration}s
                  </Badge>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm line-clamp-2">{video.prompt}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{getProviderLabel(video.provider)}</Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(video);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Opravdu chcete smazat toto video?")) {
                          onDelete(video.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Video náhled</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm opacity-70">Video preview placeholder</p>
                    <p className="text-xs opacity-50 mt-2">{selectedVideo.video_url}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge>{getProviderLabel(selectedVideo.provider)}</Badge>
                  <Badge variant="outline">{selectedVideo.duration} sekund</Badge>
                </div>
                <p className="text-sm">{selectedVideo.prompt}</p>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleDownload(selectedVideo)} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Stáhnout
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Opravdu chcete smazat toto video?")) {
                        onDelete(selectedVideo.id);
                        setSelectedVideo(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Smazat
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