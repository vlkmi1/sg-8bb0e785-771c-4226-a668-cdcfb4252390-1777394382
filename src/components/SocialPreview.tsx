import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Heart, Send, Bookmark, Play, ImageIcon } from "lucide-react";
import type { SocialPlatform } from "@/services/socialPostsService";

interface SocialPreviewProps {
  platform: SocialPlatform;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
}

export function SocialPreview({ platform, content, imageUrl, videoUrl }: SocialPreviewProps) {
  const renderFacebookPreview = () => (
    <Card className="max-w-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-primary/10">
            <div className="flex items-center justify-center h-full text-primary font-semibold">
              U
            </div>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">Váš účet</p>
            <p className="text-xs text-muted-foreground">Právě teď · 🌐</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Media */}
        {imageUrl && (
          <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-muted">
            <img 
              src={imageUrl} 
              alt="Post media" 
              className="w-full object-cover max-h-96"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        {videoUrl && !imageUrl && (
          <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-black">
            <video 
              src={videoUrl} 
              controls 
              className="w-full max-h-96"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <div className="flex items-center gap-6 pt-2 border-t text-muted-foreground">
          <button className="flex items-center gap-2 text-sm hover:text-primary">
            <ThumbsUp className="h-4 w-4" />
            Líbí se mi
          </button>
          <button className="flex items-center gap-2 text-sm hover:text-primary">
            <MessageCircle className="h-4 w-4" />
            Komentář
          </button>
          <button className="flex items-center gap-2 text-sm hover:text-primary">
            <Share2 className="h-4 w-4" />
            Sdílet
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const renderInstagramPreview = () => (
    <Card className="max-w-lg border-2 rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500">
            <div className="flex items-center justify-center h-full text-white font-semibold text-sm">
              U
            </div>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">vás_účet</p>
          </div>
          <MoreHorizontal className="h-5 w-5" />
        </div>
      </CardHeader>
      <div className="aspect-square bg-muted flex items-center justify-center">
        <ImageIcon className="h-16 w-16 text-muted-foreground" />
      </div>
      <CardContent className="pt-3 space-y-3">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6" />
          <MessageCircle className="h-6 w-6" />
          <Send className="h-6 w-6" />
          <Bookmark className="h-6 w-6 ml-auto" />
        </div>
        <p className="text-sm">
          <span className="font-semibold">vás_účet</span> {content}
        </p>
      </CardContent>
    </Card>
  );

  const renderLinkedInPreview = () => (
    <Card className="max-w-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-blue-600">
            <div className="flex items-center justify-center h-full text-white font-semibold">
              U
            </div>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">Vaše jméno</p>
            <p className="text-xs text-muted-foreground">Profesionální pozice</p>
            <p className="text-xs text-muted-foreground">Právě teď · 🌐</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Media */}
        {imageUrl && (
          <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-muted">
            <img 
              src={imageUrl} 
              alt="Post media" 
              className="w-full object-cover max-h-96"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        {videoUrl && !imageUrl && (
          <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-black">
            <video 
              src={videoUrl} 
              controls 
              className="w-full max-h-96"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Content */}
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <div className="flex items-center gap-1 pt-2 border-t text-muted-foreground text-xs">
          <ThumbsUp className="h-3 w-3 text-blue-600" />
          <MessageCircle className="h-3 w-3 text-blue-600" />
          <span className="ml-1">125 reakcí · 38 komentářů</span>
        </div>
        <div className="flex items-center gap-6 pt-2 border-t text-muted-foreground">
          <button className="flex items-center gap-2 text-sm hover:text-primary">
            <ThumbsUp className="h-4 w-4" />
            Líbí se mi
          </button>
          <button className="flex items-center gap-2 text-sm hover:text-primary">
            <MessageCircle className="h-4 w-4" />
            Komentovat
          </button>
          <button className="flex items-center gap-2 text-sm hover:text-primary">
            <Share2 className="h-4 w-4" />
            Sdílet
          </button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTwitterPreview = () => (
    <Card className="max-w-lg border-2 bg-black text-white">
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 bg-primary">
            <div className="flex items-center justify-center h-full text-white font-semibold">
              U
            </div>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Váš účet</span>
              <span className="text-gray-500">@username · Právě teď</span>
            </div>
            {/* Media */}
            {imageUrl && (
              <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-muted">
                <img 
                  src={imageUrl} 
                  alt="Post media" 
                  className="w-full object-cover max-h-96"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
            {videoUrl && !imageUrl && (
              <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-black">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full max-h-96"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Content */}
            <p className="text-sm whitespace-pre-wrap">{content.slice(0, 280)}</p>
            {content.length > 280 && (
              <p className="text-xs text-gray-500">... zkráceno na 280 znaků</p>
            )}
            <div className="flex items-center gap-16 pt-2 text-gray-500">
              <button className="flex items-center gap-2 hover:text-blue-400">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">24</span>
              </button>
              <button className="flex items-center gap-2 hover:text-green-400">
                <Share2 className="h-4 w-4" />
                <span className="text-xs">12</span>
              </button>
              <button className="flex items-center gap-2 hover:text-red-400">
                <Heart className="h-4 w-4" />
                <span className="text-xs">156</span>
              </button>
              <button className="hover:text-blue-400">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderYouTubePreview = () => (
    <Card className="max-w-lg border-2">
      <div className="aspect-video bg-black relative flex items-center justify-center">
        <Play className="h-20 w-20 text-white opacity-80" />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          10:24
        </div>
      </div>
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 bg-red-600">
            <div className="flex items-center justify-center h-full text-white font-semibold text-sm">
              U
            </div>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm line-clamp-2">{content.split('\n')[0]}</h3>
            <p className="text-xs text-muted-foreground mt-1">Váš kanál</p>
            <p className="text-xs text-muted-foreground">123K zhlédnutí · před 2 hodinami</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
        {/* Media */}
        {imageUrl && (
          <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-muted">
            <img 
              src={imageUrl} 
              alt="Post media" 
              className="w-full object-cover max-h-96"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        {videoUrl && !imageUrl && (
          <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden bg-black">
            <video 
              src={videoUrl} 
              controls 
              className="w-full max-h-96"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Content */}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
          {content}
        </p>
      </CardContent>
    </Card>
  );

  const renderTikTokPreview = () => (
    <Card className="max-w-sm border-2 bg-black text-white overflow-hidden">
      <div className="relative aspect-[9/16] bg-gradient-to-b from-purple-900/20 to-black flex items-center justify-center">
        <Play className="h-16 w-16 text-white opacity-80" />
        
        {/* Right side actions */}
        <div className="absolute right-2 bottom-20 space-y-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-500 border-2 border-white">
              <div className="flex items-center justify-center h-full text-white font-semibold">
                U
              </div>
            </Avatar>
          </div>
          <button className="flex flex-col items-center">
            <Heart className="h-8 w-8" />
            <span className="text-xs mt-1">12.5K</span>
          </button>
          <button className="flex flex-col items-center">
            <MessageCircle className="h-8 w-8" />
            <span className="text-xs mt-1">1,234</span>
          </button>
          <button className="flex flex-col items-center">
            <Share2 className="h-8 w-8" />
            <span className="text-xs mt-1">2,345</span>
          </button>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="space-y-2">
            <p className="font-semibold">@username</p>
            <p className="text-sm line-clamp-3">{content}</p>
            <div className="flex items-center gap-2 text-xs">
              <span>🎵 Originální audio</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const previews = {
    facebook: renderFacebookPreview(),
    instagram: renderInstagramPreview(),
    linkedin: renderLinkedInPreview(),
    twitter: renderTwitterPreview(),
    youtube: renderYouTubePreview(),
    tiktok: renderTikTokPreview(),
  };

  return previews[platform];
}