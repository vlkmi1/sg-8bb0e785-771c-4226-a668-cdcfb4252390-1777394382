import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Coins, 
  AlertTriangle,
  Check,
  Clock,
  Wand2,
  Calendar as CalendarIcon,
  Zap
} from "lucide-react";
import { creditsService } from "@/services/creditsService";
import { socialPostsService, type SocialPlatform } from "@/services/socialPostsService";
import type { DateRange } from "react-day-picker";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", cost: 1 },
  { id: "instagram", name: "Instagram", icon: "📷", cost: 1 },
  { id: "linkedin", name: "LinkedIn", icon: "💼", cost: 1 },
  { id: "twitter", name: "Twitter/X", icon: "𝕏", cost: 1 },
  { id: "youtube", name: "YouTube", icon: "📹", cost: 1 },
  { id: "tiktok", name: "TikTok", icon: "🎵", cost: 1 },
];

const CONTENT_TYPES = [
  { id: "custom", name: "Vlastní témata", description: "Zadejte seznam témat pro příspěvky" },
  { id: "auto", name: "AI automaticky", description: "AI vytvoří relevantní témata pro váš brand" },
];

const POST_TIMES = [
  { id: "morning", name: "Ráno", time: "08:00", description: "8:00 - 10:00" },
  { id: "noon", name: "Poledne", time: "12:00", description: "12:00 - 14:00" },
  { id: "afternoon", name: "Odpoledne", time: "16:00", description: "16:00 - 18:00" },
  { id: "evening", name: "Večer", time: "20:00", description: "20:00 - 22:00" },
];

interface AutoPostWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function AutoPostWizard({ open, onOpenChange, onComplete }: AutoPostWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  
  // Step 2: Content type and topics
  const [contentType, setContentType] = useState<"custom" | "auto">("auto");
  const [topics, setTopics] = useState<string[]>([""]);
  const [brandContext, setBrandContext] = useState("");
  
  // Step 3: Schedule
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["morning"]);
  
  // Credits
  const [credits, setCredits] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [hasEnoughCredits, setHasEnoughCredits] = useState(true);

  useEffect(() => {
    if (open) {
      loadCredits();
      resetWizard();
    }
  }, [open]);

  useEffect(() => {
    calculateCost();
  }, [selectedPlatforms, postsPerDay, dateRange]);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedPlatforms([]);
    setContentType("auto");
    setTopics([""]);
    setBrandContext("");
    setPostsPerDay(1);
    setDateRange(undefined);
    setSelectedTimes(["morning"]);
  };

  const calculateCost = () => {
    if (!dateRange?.from || !dateRange?.to) {
      setTotalCost(0);
      setHasEnoughCredits(true);
      return;
    }

    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalPosts = days * postsPerDay * selectedPlatforms.length;
    const cost = totalPosts; // 1 credit per post
    
    setTotalCost(cost);
    setHasEnoughCredits(credits >= cost);
  };

  const togglePlatform = (platformId: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const toggleTime = (timeId: string) => {
    setSelectedTimes(prev =>
      prev.includes(timeId)
        ? prev.filter(t => t !== timeId)
        : [...prev, timeId]
    );
  };

  const addTopic = () => {
    setTopics(prev => [...prev, ""]);
  };

  const updateTopic = (index: number, value: string) => {
    setTopics(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const removeTopic = (index: number) => {
    setTopics(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1 && selectedPlatforms.length === 0) {
      alert("Vyberte alespoň jednu platformu");
      return;
    }
    if (step === 2 && contentType === "custom" && topics.filter(t => t.trim()).length === 0) {
      alert("Zadejte alespoň jedno téma");
      return;
    }
    if (step === 2 && contentType === "auto" && !brandContext.trim()) {
      alert("Popište váš brand/business");
      return;
    }
    if (step === 3 && (!dateRange?.from || !dateRange?.to)) {
      alert("Vyberte časové období");
      return;
    }
    if (step === 3 && selectedTimes.length === 0) {
      alert("Vyberte alespoň jeden čas postování");
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    if (!hasEnoughCredits) {
      alert("Nemáte dostatek kreditů. Doplňte si kredity pro pokračování.");
      return;
    }

    setLoading(true);
    try {
      if (!dateRange?.from || !dateRange?.to) return;

      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      let generatedCount = 0;
      const totalToGenerate = days * postsPerDay * selectedPlatforms.length;

      // Generate topics if auto mode
      let postTopics: string[] = [];
      if (contentType === "auto") {
        // Call API to generate topics based on brand context
        const topicsResponse = await fetch("/api/generate-social-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: `Generate ${days * postsPerDay} diverse topic ideas for social media posts about: ${brandContext}. Return as comma-separated list.`,
            platform: "facebook",
          }),
        });
        const topicsData = await topicsResponse.json();
        postTopics = topicsData.content.split(",").map((t: string) => t.trim());
      } else {
        postTopics = topics.filter(t => t.trim());
      }

      // Generate posts for each day
      for (let dayOffset = 0; dayOffset < days; dayOffset++) {
        const currentDate = new Date(dateRange.from);
        currentDate.setDate(currentDate.getDate() + dayOffset);

        // Generate posts for each time slot
        for (let postIndex = 0; postIndex < postsPerDay; postIndex++) {
          const topicIndex = (dayOffset * postsPerDay + postIndex) % postTopics.length;
          const topic = postTopics[topicIndex];
          
          const timeSlot = selectedTimes[postIndex % selectedTimes.length];
          const timeConfig = POST_TIMES.find(t => t.id === timeSlot);
          
          const [hours, minutes] = timeConfig?.time.split(":") || ["12", "00"];
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0);

          // Generate for each platform
          for (const platform of selectedPlatforms) {
            const response = await fetch("/api/generate-social-post", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topic, platform }),
            });

            const data = await response.json();

            await socialPostsService.createPost({
              platform,
              content: data.content,
              scheduled_time: scheduledTime.toISOString(),
            });

            generatedCount++;
          }
        }
      }

      // Deduct credits
      await creditsService.deductCredits(totalToGenerate);

      alert(`✅ Úspěšně vygenerováno ${generatedCount} příspěvků!`);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating posts:", error);
      alert("Chyba při generování příspěvků. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  };

  const getDaysCount = () => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Průvodce automatickým postováním
          </DialogTitle>
          <DialogDescription>
            Krok {step} z 4: Naplánujte si automatické generování a postování příspěvků
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Průběh</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <Progress value={(step / 4) * 100} />
          </div>

          {/* Credits Info */}
          <Alert>
            <Coins className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Dostupné kredity: <strong>{credits}</strong></span>
              {totalCost > 0 && (
                <span className={hasEnoughCredits ? "text-accent" : "text-destructive"}>
                  Potřeba: <strong>{totalCost}</strong> kreditů
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Step 1: Platform Selection */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Výběr platforem</CardTitle>
                <CardDescription>
                  Na které sociální sítě chcete postovat?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PLATFORMS.map((platform) => (
                    <div
                      key={platform.id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedPlatforms.includes(platform.id as SocialPlatform)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => togglePlatform(platform.id as SocialPlatform)}
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(platform.id as SocialPlatform)}
                        onCheckedChange={() => togglePlatform(platform.id as SocialPlatform)}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-xl">{platform.icon}</span>
                          {platform.name}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {platform.cost} kredit/post
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Content Type */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Typ obsahu</CardTitle>
                <CardDescription>
                  Jak chcete vytvářet obsah pro příspěvky?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  {CONTENT_TYPES.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        contentType === type.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setContentType(type.id as "custom" | "auto")}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={contentType === type.id}
                          onCheckedChange={() => setContentType(type.id as "custom" | "auto")}
                        />
                        <div className="space-y-1">
                          <div className="font-medium">{type.name}</div>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {contentType === "custom" && (
                  <div className="space-y-3">
                    <Label>Témata příspěvků</Label>
                    {topics.map((topic, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Téma ${index + 1}...`}
                          value={topic}
                          onChange={(e) => updateTopic(index, e.target.value)}
                        />
                        {topics.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeTopic(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addTopic} className="w-full">
                      + Přidat téma
                    </Button>
                  </div>
                )}

                {contentType === "auto" && (
                  <div className="space-y-2">
                    <Label htmlFor="brand-context">Popis vašeho brandu/businessu</Label>
                    <Textarea
                      id="brand-context"
                      placeholder="Např. Prodáváme ručně vyráběné šperky s důrazem na udržitelnost..."
                      value={brandContext}
                      onChange={(e) => setBrandContext(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      AI automaticky vytvoří relevantní témata pro váš brand
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Plánování</CardTitle>
                <CardDescription>
                  Kdy a jak často chcete postovat?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Časové období</Label>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="rounded-md border w-full"
                  />
                  {dateRange?.from && dateRange?.to && (
                    <p className="text-sm text-muted-foreground">
                      Vybrané období: {getDaysCount()} dní
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Počet příspěvků za den</Label>
                  <Select
                    value={postsPerDay.toString()}
                    onValueChange={(v) => setPostsPerDay(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 příspěvek denně</SelectItem>
                      <SelectItem value="2">2 příspěvky denně</SelectItem>
                      <SelectItem value="3">3 příspěvky denně</SelectItem>
                      <SelectItem value="4">4 příspěvky denně</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Časy postování</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {POST_TIMES.map((time) => (
                      <div
                        key={time.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTimes.includes(time.id)
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleTime(time.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedTimes.includes(time.id)}
                            onCheckedChange={() => toggleTime(time.id)}
                          />
                          <div>
                            <div className="font-medium text-sm">{time.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {time.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pokud je počet příspěvků větší než počet vybraných časů, budou se časy opakovat
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Souhrn a potvrzení</CardTitle>
                <CardDescription>
                  Zkontrolujte nastavení před spuštěním
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Platformy</span>
                    <div className="flex gap-1">
                      {selectedPlatforms.map(p => (
                        <span key={p} className="text-lg">
                          {PLATFORMS.find(pl => pl.id === p)?.icon}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Typ obsahu</span>
                    <span className="font-medium">
                      {contentType === "auto" ? "AI automaticky" : "Vlastní témata"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Období</span>
                    <span className="font-medium">{getDaysCount()} dní</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Příspěvků za den</span>
                    <span className="font-medium">{postsPerDay}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Celkem příspěvků</span>
                    <span className="font-medium text-lg">
                      {getDaysCount() * postsPerDay * selectedPlatforms.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Celková cena</span>
                    <Badge variant={hasEnoughCredits ? "default" : "destructive"} className="text-lg">
                      <Coins className="h-4 w-4 mr-1" />
                      {totalCost} kreditů
                    </Badge>
                  </div>
                </div>

                {!hasEnoughCredits && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Nemáte dostatek kreditů! Potřebujete {totalCost - credits} kreditů navíc.
                      <br />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.href = "/credits"}
                      >
                        Doplnit kredity
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Zpět
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext}>
                Další
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!hasEnoughCredits || loading}
                className="min-w-[150px]"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generování...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Spustit generování
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}