import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, LogOut, Volume2, VolumeX, Loader2, Radio, MessageSquare, Settings, Coins, Play, Pause, StopCircle } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { voiceService, type VoiceConversation, type VoiceProvider } from "@/services/voiceService";
import { creditsService } from "@/services/creditsService";
import { useToast } from "@/hooks/use-toast";

const VOICE_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "Whisper & TTS" },
  { id: "elevenlabs", name: "ElevenLabs", icon: "🎙️", description: "Ultra-realistic voices" },
  { id: "google", name: "Google Cloud", icon: "🔊", description: "Cloud TTS & STT" },
];

export default function VoiceChat() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("record");
  const [messages, setMessages] = useState<VoiceConversation[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [provider, setProvider] = useState<VoiceProvider>("openai");
  const [credits, setCredits] = useState(0);
  const [conversation, setConversation] = useState<Array<{role: "user" | "assistant", content: string}>>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadMessages();
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

  const loadMessages = async () => {
    try {
      const data = await voiceService.getVoiceConversations();
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      
      toast({
        title: "Nahrávání",
        description: "Mluvte do mikrofonu...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se získat přístup k mikrofonu",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (credits < 5) {
      toast({
        title: "Nedostatek kreditů",
        description: "Potřebujete alespoň 5 kreditů pro hlasový chat",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        try {
          // Call backend API
          const result = await voiceService.processVoiceMessage(base64Audio, provider);

          // Add to conversation
          const userMessage = { role: "user" as const, content: result.transcript };
          const assistantMessage = { role: "assistant" as const, content: result.response };
          setConversation(prev => [...prev, userMessage, assistantMessage]);

          // Save to database
          await voiceService.createVoiceConversation({
            provider,
            transcript: result.transcript,
            response_text: result.response,
            response_audio_url: result.audioUrl,
          });

          // Deduct credits
          const newCredits = await creditsService.deductCredits(5);
          setCredits(newCredits);

          // Play response audio
          if (result.audioUrl && audioRef.current) {
            audioRef.current.src = result.audioUrl;
            audioRef.current.play();
          }

          toast({
            title: "Úspěch",
            description: "Zpráva zpracována",
          });

          await loadMessages();
        } catch (error: any) {
          console.error("Error processing audio:", error);
          toast({
            title: "Chyba",
            description: error.message || "Nepodařilo se zpracovat audio",
            variant: "destructive",
          });
        } finally {
          setProcessing(false);
        }
      };
    } catch (error) {
      console.error("Error in processAudio:", error);
      setProcessing(false);
      toast({
        title: "Chyba",
        description: "Nepodařilo se zpracovat nahrávku",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
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
              <TabsTrigger value="record">
                <Radio className="h-4 w-4 mr-2" />
                Nahrávání
              </TabsTrigger>
              <TabsTrigger value="history">
                <MessageSquare className="h-4 w-4 mr-2" />
                Historie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      Hlasová zpráva
                    </CardTitle>
                    <CardDescription>
                      Nahrajte hlasovou zprávu a AI vám odpoví. (5 kreditů za zprávu)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center py-8 space-y-6">
                        <div className="relative">
                          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                            recording 
                              ? "bg-accent/20 animate-pulse" 
                              : processing
                                ? "bg-primary/20 animate-pulse"
                                : "bg-muted"
                          }`}>
                            {recording && <Mic className="h-16 w-16 text-accent" />}
                            {processing && <Loader2 className="h-16 w-16 text-primary animate-spin" />}
                            {!recording && !processing && <MicOff className="h-16 w-16 text-muted-foreground" />}
                          </div>
                          {recording && (
                            <div className="absolute -bottom-2 -right-2">
                              <Badge variant="default" className="bg-accent">
                                <Radio className="h-3 w-3 mr-1 animate-pulse" />
                                REC
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold">
                            {!recording && !processing && "Připraveno"}
                            {recording && "Nahrávám..."}
                            {processing && "Zpracovávám..."}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {recording && "Stiskněte Stop pro ukončení"}
                            {processing && "Generuji odpověď AI..."}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          {!recording && !processing && (
                            <Button
                              size="lg"
                              onClick={startRecording}
                              className="gap-2"
                            >
                              <Mic className="h-5 w-5" />
                              Začít nahrávat
                            </Button>
                          )}
                          {recording && (
                            <Button
                              size="lg"
                              onClick={stopRecording}
                              variant="destructive"
                              className="gap-2"
                            >
                              <StopCircle className="h-5 w-5" />
                              Zastavit
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label>AI Provider</Label>
                          <Select value={provider} onValueChange={(v) => setProvider(v as VoiceProvider)} disabled={recording || processing}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VOICE_PROVIDERS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.icon} {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Konverzace</CardTitle>
                    <CardDescription>
                      Přepis vaší konverzace s AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {conversation.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Zatím žádná konverzace. Začněte nahrávat hlasovou zprávu.
                        </p>
                      ) : (
                        conversation.map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg ${
                              msg.role === "user" 
                                ? "bg-primary/10 ml-8" 
                                : "bg-secondary/10 mr-8"
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1">
                              {msg.role === "user" ? "Vy" : "AI Asistent"}
                            </p>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">💡 Tipy pro hlasový chat</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Mluvte zřetelně a v tichém prostředí</p>
                  <p>• Klikněte "Začít nahrávat" a mluvte do mikrofonu</p>
                  <p>• Po dokončení klikněte "Zastavit"</p>
                  <p>• AI zpracuje váš hlas, odpoví a přečte odpověď</p>
                  <p>• Každá zpráva stojí 5 kreditů</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Historie konverzací</CardTitle>
                  <CardDescription>
                    Všechny vaše hlasové zprávy a přepisy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím nemáte žádné nahrávky
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <Card key={message.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-primary/10 rounded-lg">
                                <Mic className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-2">
                                  {new Date(message.created_at).toLocaleString("cs-CZ")}
                                </p>
                                {message.transcript && (
                                  <div className="mb-3 p-3 bg-muted/50 rounded">
                                    <p className="text-xs text-muted-foreground mb-1">Vy:</p>
                                    <p className="text-sm">{message.transcript}</p>
                                  </div>
                                )}
                                {message.response_text && (
                                  <div className="p-3 bg-primary/5 rounded">
                                    <p className="text-xs text-muted-foreground mb-1">AI:</p>
                                    <p className="text-sm">{message.response_text}</p>
                                  </div>
                                )}
                                <div className="flex gap-2 mt-3">
                                  <Badge variant="secondary">
                                    {VOICE_PROVIDERS.find(p => p.id === message.provider)?.name}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Hidden audio element for playing responses */}
          <audio ref={audioRef} className="hidden" />
        </main>
      </div>
    </AuthGuard>
  );
}