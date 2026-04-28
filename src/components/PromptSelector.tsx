import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Search, Copy, Sparkles } from "lucide-react";
import { favoritePromptsService, type PromptCategory, type FavoritePrompt } from "@/services/favoritePromptsService";
import { useToast } from "@/hooks/use-toast";

interface PromptSelectorProps {
  category: PromptCategory;
  onSelect: (promptText: string, promptId?: string) => void;
}

export function PromptSelector({ category, onSelect }: PromptSelectorProps) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<FavoritePrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPrompts();
    }
  }, [open, category]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await favoritePromptsService.getPromptsByCategory(category);
      setPrompts(data);
    } catch (error) {
      console.error("Error loading prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (prompt: FavoritePrompt) => {
    try {
      await favoritePromptsService.incrementUseCount(prompt.id);
      onSelect(prompt.prompt_text, prompt.id);
      setOpen(false);
      toast({
        title: "Prompt načten",
        description: prompt.title,
      });
    } catch (error) {
      console.error("Error selecting prompt:", error);
    }
  };

  const filteredPrompts = searchQuery
    ? prompts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.prompt_text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prompts;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Oblíbené prompty
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Oblíbené prompty</h4>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat prompty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-72">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Načítání...
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Zatím nemáte žádné uložené prompty</p>
                <p className="text-xs mt-1">
                  Uložte si prompty pro rychlé použití
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleSelect(prompt)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5 className="font-medium text-sm flex items-center gap-1">
                        {prompt.is_favorite && (
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        )}
                        {prompt.title}
                      </h5>
                      <Badge variant="outline" className="text-xs">
                        {prompt.use_count}×
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {prompt.prompt_text}
                    </p>
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {prompt.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                window.open("/favorite-prompts", "_blank");
              }}
            >
              Spravovat všechny prompty →
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}