import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Share2, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter,
  Youtube,
  FileText,
  Clock,
  User,
  MessageSquare,
  Copy,
  Check
} from "lucide-react";
import type { InfluencerVideo } from "@/services/aiInfluencerService";

interface VideoDetailDialogProps {
  video: InfluencerVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseInSocialMedia?: (video: InfluencerVideo) => void;
}

export function VideoDetailDialog({ 
  video, 
  open, 
  onOpenChange,
  onUseInSocialMedia 
}: VideoDetailDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!video) return null;

  const handleDownload = async () => {
    if (!video.video_url) {
      toast({
        title: "❌ Chyba",
        description: "Video URL není k dispozici",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `influencer-video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Staženo",
        description: "Video bylo úspěšně staženo",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "❌ Chyba",
        description: "Nepodařilo se stáhnout video",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    if (!video.video_url) return;

    try {
      await navigator.clipboard.writeText(video.video_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "✅ Zkopírováno",
        description: "URL videa zkopírováno do schránky",
      });
    } catch (error) {
      toast({
        title: "❌ Chyba",
        description: "Nepodařilo se zkopírovat URL",
        variant: "destructive",
      });
    }
  };

  const handleShareToSocial = (platform: string) => {
    if (!video.video_url) return;

    const encodedUrl = encodeURIComponent(video.video_url);
    const encodedText = encodeURIComponent(video.script.slice(0, 100) + "...");

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    const url = urls[platform];
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  const handleUseInSocialMedia = () => {
    if (onUseInSocialMedia) {
      onUseInSocialMedia(video);
      onOpenChange(false);
      
      toast({
        title: "✅ Přesunuto",
        description: "Video přidáno do Social Media Posts",
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detail videa
          </DialogTitle>
          <DialogDescription>
            Náhled, stažení a sdílení vašeho AI influencer videa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {video.video_url ? (
              <video 
                src={video.video_url} 
                controls 
                className="w-full h-full"
                poster={video.ai_influencers?.avatar_url}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">Video se zpracovává...</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-accent">
                {video.ai_influencers?.avatar_url ? (
                  <AvatarImage src={video.ai_influencers.avatar_url} />
                ) : null}
                <AvatarFallback className="text-white font-semibold">
                  {video.ai_influencers?.name.slice(0, 2).toUpperCase() || "AI"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {video.ai_influencers?.name || "AI Influencer"}
                </h3>
                <div className="flex gap-2 mt-1">
                  {video.duration && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(video.duration)}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {video.ai_influencers?.voice_type || "Neutral"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Script */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Scénář videa
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {video.script}
                </p>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Akce</h4>
              
              {/* Download and Copy */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownload} 
                  className="flex-1"
                  disabled={!video.video_url}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Stáhnout video
                </Button>
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                  disabled={!video.video_url}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Use in Social Media */}
              {onUseInSocialMedia && (
                <Button 
                  onClick={handleUseInSocialMedia}
                  variant="secondary"
                  className="w-full"
                  disabled={!video.video_url}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Použít v Social Media Posts
                </Button>
              )}

              {/* Share to Social Networks */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Rychlé sdílení</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareToSocial("facebook")}
                    disabled={!video.video_url}
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareToSocial("twitter")}
                    disabled={!video.video_url}
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareToSocial("linkedin")}
                    disabled={!video.video_url}
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Pro Instagram, YouTube a TikTok použijte "Použít v Social Media Posts"
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}