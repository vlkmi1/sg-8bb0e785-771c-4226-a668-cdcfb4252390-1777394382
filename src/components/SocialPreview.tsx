import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Send, Bookmark, MoreHorizontal } from "lucide-react";
import type { SocialPlatform } from "@/services/socialPostsService";

interface SocialPreviewProps {
  platform: SocialPlatform;
  content: string;
  imageUrl?: string;
  accountName?: string;
}

export function SocialPreview({ platform, content, imageUrl, accountName = "Váš účet" }: SocialPreviewProps) {
  const renderFacebookPreview = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-primary/10">
            <span className="text-sm">📘</span>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{accountName}</p>
            <p className="text-xs text-muted-foreground">Právě teď · 🌎</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {imageUrl && (
          <img src={imageUrl} alt="Post" className="w-full rounded-lg" />
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Heart className="h-5 w-5" />
            <span className="text-xs">Líbí se mi</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">Komentář</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Sdílet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderInstagramPreview = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <span className="text-sm">📷</span>
            </Avatar>
            <p className="font-semibold text-sm">{accountName}</p>
          </div>
          <MoreHorizontal className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {imageUrl && (
          <img src={imageUrl} alt="Post" className="w-full aspect-square object-cover" />
        )}
        <div className="px-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Heart className="h-6 w-6" />
              <MessageCircle className="h-6 w-6" />
              <Send className="h-6 w-6" />
            </div>
            <Bookmark className="h-6 w-6" />
          </div>
          <p className="text-sm">
            <span className="font-semibold">{accountName}</span> {content}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderLinkedInPreview = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-blue-600">
            <span className="text-sm">💼</span>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{accountName}</p>
            <p className="text-xs text-muted-foreground">Profesionální profil</p>
            <p className="text-xs text-muted-foreground">Právě teď · 🌐</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {imageUrl && (
          <img src={imageUrl} alt="Post" className="w-full rounded-lg" />
        )}
        <div className="flex items-center gap-4 pt-2 border-t text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-5 w-5" />
            <span className="text-xs">Líbí se mi</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">Komentovat</span>
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-5 w-5" />
            <span className="text-xs">Sdílet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTwitterPreview = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-blue-400">
            <span className="text-sm">𝕏</span>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm">{accountName}</p>
              <span className="text-xs text-muted-foreground">@{accountName.toLowerCase().replace(/\s/g, "")}</span>
            </div>
            <p className="text-xs text-muted-foreground">Právě teď</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {imageUrl && (
          <img src={imageUrl} alt="Post" className="w-full rounded-2xl border" />
        )}
        <div className="flex items-center justify-between pt-2 text-muted-foreground">
          <MessageCircle className="h-5 w-5" />
          <Share2 className="h-5 w-5" />
          <Heart className="h-5 w-5" />
          <Bookmark className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );

  const previews = {
    facebook: renderFacebookPreview(),
    instagram: renderInstagramPreview(),
    linkedin: renderLinkedInPreview(),
    twitter: renderTwitterPreview(),
  };

  return previews[platform];
}