import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Pause, Trash2, LogOut, Coins, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { voiceService, type VoiceProvider, type VoiceConversation } from "@/services/voiceService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";

export default function VoiceChat() {
  const router = useRouter();
  const [provider, setProvider] = useState<VoiceProvider>("openai");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<VoiceConversation[]>([]);
  const [credits, setCredits] = useState(0);
  const [activeTab, setActiveTab] = useState("record");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadConversations();
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await voiceService.getVoiceConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Nelze získat přístup k mikrofonu");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    if (credits < 3) {
      alert("Nemáte dostatek kreditů. Hlasová konverzace stojí 3 kredity. Kontaktujte administrátora.");
      return;
    }

    setLoading(true);
    try {
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
      const audioUrl = await voiceService.uploadAudio(audioFile);

      await voiceService.createVoiceConversation({
        provider,
        audio_url: audioUrl,
        transcript: "[Simulovaný přepis hlasové zprávy]",
        duration: Math.floor(audioBlob.size / 1000),
      });

      const newCredits = await creditsService.deductCredits(3);
      setCredits(newCredits);

      await loadConversations();
      setActiveTab("history");
    } catch (error) {
      console.error("Error submitting audio:", error);
      if (error instanceof Error && error.message.includes("Insufficient credits")) {
        alert("Nemáte dostatek kreditů. Kontaktujte administrátora.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await voiceService.deleteVoiceConversation(id);
      await loadConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Hlasový chat</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
                <ThemeSwitch />
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="record">Nahrát</TabsTrigger>
              <TabsTrigger value="history">Historie</TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="font-heading">Hlasová konverzace</CardTitle>
                  <CardDescription>
                    Nahrajte svůj hlas a AI vám odpoví. Stojí 3 kredity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select value={provider} onValueChange={(v) => setProvider(v as VoiceProvider)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI Whisper + TTS</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs Voice AI</SelectItem>
                        <SelectItem value="google">Google Cloud Speech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col items-center gap-6 py-8">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                      isRecording 
                        ? "bg-destructive/20 animate-pulse" 
                        : "bg-primary/10 hover:bg-primary/20"
                    }`}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-24 h-24 rounded-full"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-12 w-12 animate-spin" />
                        ) : isRecording ? (
                          <MicOff className="h-12 w-12 text-destructive" />
                        ) : (
                          <Mic className="h-12 w-12 text-primary" />
                        )}
                      </Button>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {loading ? "Zpracovávám..." : isRecording ? "Nahrávám... (klikněte pro zastavení)" : "Klikněte pro zahájení nahrávání"}
                      </p>
                      {isRecording && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Mluvte jasně a zřetelně
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Tip:</strong> Pro nejlepší výsledky mluvte v tichém prostředí a držte mikrofon blízko úst.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Historie hlasových konverzací</CardTitle>
                  <CardDescription>
                    Vaše předchozí hlasové konverzace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    {conversations.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        Zatím nemáte žádné hlasové konverzace
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversations.map((conv) => (
                          <Card key={conv.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{conv.provider}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(conv.created_at).toLocaleString("cs-CZ")}
                                    </span>
                                  </div>
                                  {conv.transcript && (
                                    <p className="text-sm text-muted-foreground">
                                      {conv.transcript}
                                    </p>
                                  )}
                                  {conv.duration && (
                                    <p className="text-xs text-muted-foreground">
                                      Délka: {conv.duration}s
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {conv.audio_url && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        if (playingId === conv.id) {
                                          setPlayingId(null);
                                        } else {
                                          setPlayingId(conv.id);
                                          const audio = new Audio(conv.audio_url!);
                                          audio.play();
                                          audio.onended = () => setPlayingId(null);
                                        }
                                      }}
                                    >
                                      {playingId === conv.id ? (
                                        <Pause className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDelete(conv.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}