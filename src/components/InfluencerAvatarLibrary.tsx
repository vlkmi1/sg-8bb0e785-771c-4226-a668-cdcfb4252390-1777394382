import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, Briefcase, GraduationCap, Heart, Sparkles, Check } from "lucide-react";

interface AvatarTemplate {
  id: string;
  name: string;
  description: string;
  category: "business" | "lifestyle" | "education" | "entertainment" | "fitness";
  gender: "male" | "female" | "neutral";
  ageRange: string;
  imageUrl: string;
  voiceType: "neutral" | "energetic" | "calm" | "professional" | "friendly";
  personality: "professional" | "casual" | "humorous" | "inspirational" | "educational";
  tags: string[];
}

const AVATAR_TEMPLATES: AvatarTemplate[] = [
  // Business
  {
    id: "business-1",
    name: "David Chen",
    description: "Profesionální business konzultant, specialista na technologie",
    category: "business",
    gender: "male",
    ageRange: "35-45",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    voiceType: "professional",
    personality: "professional",
    tags: ["business", "tech", "konzultant"],
  },
  {
    id: "business-2",
    name: "Sarah Williams",
    description: "Finanční poradkyně a investiční expertka",
    category: "business",
    gender: "female",
    ageRange: "30-40",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    voiceType: "professional",
    personality: "professional",
    tags: ["finance", "investice", "poradce"],
  },
  {
    id: "business-3",
    name: "Marcus Thompson",
    description: "CEO a leadership mentor pro startupy",
    category: "business",
    gender: "male",
    ageRange: "40-50",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    voiceType: "professional",
    personality: "inspirational",
    tags: ["leadership", "startup", "CEO"],
  },

  // Lifestyle
  {
    id: "lifestyle-1",
    name: "Emma Rodriguez",
    description: "Lifestyle blogerka a wellness coach",
    category: "lifestyle",
    gender: "female",
    ageRange: "25-35",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    voiceType: "friendly",
    personality: "casual",
    tags: ["wellness", "lifestyle", "health"],
  },
  {
    id: "lifestyle-2",
    name: "Alex Kim",
    description: "Travel influencer a fotograf",
    category: "lifestyle",
    gender: "male",
    ageRange: "25-35",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    voiceType: "energetic",
    personality: "casual",
    tags: ["travel", "photography", "adventure"],
  },
  {
    id: "lifestyle-3",
    name: "Sophie Martin",
    description: "Fashion stylistka a trendsetter",
    category: "lifestyle",
    gender: "female",
    ageRange: "28-38",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    voiceType: "friendly",
    personality: "casual",
    tags: ["fashion", "style", "trends"],
  },

  // Education
  {
    id: "education-1",
    name: "Dr. James Parker",
    description: "Profesor psychologie a vzdělávací expert",
    category: "education",
    gender: "male",
    ageRange: "45-55",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    voiceType: "calm",
    personality: "educational",
    tags: ["psychologie", "vzdělání", "věda"],
  },
  {
    id: "education-2",
    name: "Lisa Anderson",
    description: "Online učitelka a e-learning specialistka",
    category: "education",
    gender: "female",
    ageRange: "30-40",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    voiceType: "friendly",
    personality: "educational",
    tags: ["online learning", "vzdělání", "kurzy"],
  },
  {
    id: "education-3",
    name: "Prof. Michael Brown",
    description: "Technologický expert a programovací mentor",
    category: "education",
    gender: "male",
    ageRange: "35-45",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    voiceType: "professional",
    personality: "educational",
    tags: ["programování", "tech", "AI"],
  },

  // Entertainment
  {
    id: "entertainment-1",
    name: "Chris Taylor",
    description: "Komik a entertainer pro sociální sítě",
    category: "entertainment",
    gender: "male",
    ageRange: "25-35",
    imageUrl: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop",
    voiceType: "energetic",
    personality: "humorous",
    tags: ["comedy", "entertainment", "humor"],
  },
  {
    id: "entertainment-2",
    name: "Maya Johnson",
    description: "Content creatorka a storytellerka",
    category: "entertainment",
    gender: "female",
    ageRange: "22-32",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    voiceType: "energetic",
    personality: "humorous",
    tags: ["storytelling", "content", "kreativita"],
  },

  // Fitness
  {
    id: "fitness-1",
    name: "Jake Martinez",
    description: "Fitness trenér a motivační speaker",
    category: "fitness",
    gender: "male",
    ageRange: "28-38",
    imageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=400&fit=crop",
    voiceType: "energetic",
    personality: "inspirational",
    tags: ["fitness", "workout", "motivace"],
  },
  {
    id: "fitness-2",
    name: "Nicole Davis",
    description: "Yoga instruktorka a mindfulness coach",
    category: "fitness",
    gender: "female",
    ageRange: "30-40",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    voiceType: "calm",
    personality: "inspirational",
    tags: ["yoga", "mindfulness", "wellness"],
  },
];

const CATEGORY_INFO = {
  business: {
    label: "Business",
    icon: Briefcase,
    description: "Profesionální avatary pro business obsah",
  },
  lifestyle: {
    label: "Lifestyle",
    icon: Heart,
    description: "Influenceři pro lifestyle a wellness",
  },
  education: {
    label: "Vzdělání",
    icon: GraduationCap,
    description: "Učitelé a vzdělavatelé",
  },
  entertainment: {
    label: "Zábava",
    icon: Sparkles,
    description: "Entertainerové a content creatorové",
  },
  fitness: {
    label: "Fitness",
    icon: User,
    description: "Fitness trenéři a wellness koučové",
  },
};

interface InfluencerAvatarLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: AvatarTemplate) => void;
}

export function InfluencerAvatarLibrary({
  open,
  onOpenChange,
  onSelect,
}: InfluencerAvatarLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<AvatarTemplate | null>(null);

  const filteredTemplates = AVATAR_TEMPLATES.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onOpenChange(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Knihovna Avatarů</DialogTitle>
          <DialogDescription>
            Vyberte předpřipravený avatar pro svého AI influencera
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat avatary podle jména, popisu nebo tagů..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Vše</TabsTrigger>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {info.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Avatar Grid */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                    selectedTemplate?.id === template.id
                      ? "ring-2 ring-primary border-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Avatar Image */}
                      <div className="relative">
                        <Avatar className="w-full h-48 rounded-lg">
                          <AvatarImage
                            src={template.imageUrl}
                            alt={template.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-lg text-4xl">
                            {template.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {selectedTemplate?.id === template.id && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {template.ageRange}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {template.gender === "male" ? "👨" : template.gender === "female" ? "👩" : "👤"}{" "}
                            {template.gender}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            🎙️ {template.voiceType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ✨ {template.personality}
                          </Badge>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Žádné avatary neodpovídají vašemu hledání</p>
              </div>
            )}
          </ScrollArea>

          {/* Selected Template Details */}
          {selectedTemplate && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedTemplate.imageUrl} alt={selectedTemplate.name} />
                    <AvatarFallback>
                      {selectedTemplate.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{selectedTemplate.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORY_INFO[selectedTemplate.category].label} • {selectedTemplate.personality}
                    </p>
                  </div>
                </div>
                <Button onClick={handleSelectTemplate} size="lg">
                  Vybrat tohoto avatara
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}