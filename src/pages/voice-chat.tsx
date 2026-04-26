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

const VOICE_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "Whisper & TTS" },
  { id: "elevenlabs", name: "ElevenLabs", icon: "🎙️", description: "Ultra-realistic voices" },
  { id: "google", name: "Google Cloud", icon: "🔊", description: "Cloud TTS & STT" },
];

const VOICE_TYPES = [
  { id: "alloy", name: "Alloy", gender: "neutral" },
  { id: "echo", name: "Echo", gender: "male" },
  { id: "fable", name: "Fable", gender: "neutral" },
  { id: "onyx", name: "Onyx", gender: "male" },
  { id: "nova", name: "Nova", gender: "female" },
  { id: "shimmer", name: "Shimmer", gender: "female" },
];

export default function VoiceChat() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("live");
  const [messages, setMessages] = useState<VoiceConversation[]>([]);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [provider, setProvider] = useState<VoiceProvider>("openai");
  const [voiceType, setVoiceType] = useState("alloy");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Live chat states
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [conversation, setConversation] = useState<Array<{role: "user" | "assistant", content: string}>>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadMessages();
    loadCredits();
    setupSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const setupSpeechRecognition = () => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "cs-CZ";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setLiveTranscript(interimTranscript || finalTranscript);

        if (finalTranscript) {
          handleLiveMessage(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isLiveActive) {
          recognitionRef.current?.start();
        }
      };
    }
  };

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

  const toggleLiveChat = async () => {
    if (credits < 3) {
      alert("Nemáte dostatek kreditů. Potřebujete alespoň 3 kredity.");
      return;
    }

    if (!isLiveActive) {
      setIsLiveActive(true);
      setIsListening(true);
      setConversation([]);
      recognitionRef.current?.start();
    } else {
      setIsLiveActive(false);
      setIsListening(false);
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    }
  };

  const handleLiveMessage = async (transcript: string) => {
    if (!transcript.trim() || isSpeaking) return;

    setIsListening(false);
    recognitionRef.current?.stop();
    setLiveTranscript("");

    const userMessage = { role: "user" as const, content: transcript };
    setConversation(prev => [...prev, userMessage]);

    try {
      // Odečíst kredity
      const newCredits = await creditsService.deductCredits(3);
      setCredits(newCredits);

      // Simulace AI odpovědi
      const aiResponse = `Rozumím. Řekl jste: ${transcript}. Toto je ukázková odpověď AI asistenta v živém režimu.`;
      
      const assistantMessage = { role: "assistant" as const, content: aiResponse };
      setConversation(prev => [...prev, assistantMessage]);

      // Text-to-Speech
      await speakText(aiResponse);

      // Pokračovat v poslechu
      setTimeout(() => {
        if (isLiveActive) {
          setIsListening(true);
          recognitionRef.current?.start();
        }
      }, 500);

    } catch (error) {
      console.error("Error in live chat:", error);
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true);
      
      synthesisRef.current = new SpeechSynthesisUtterance(text);
      synthesisRef.current.lang = "cs-CZ";
      synthesisRef.current.rate = 1.0;
      synthesisRef.current.pitch = 1.0;

      synthesisRef.current.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      synthesisRef.current.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(synthesisRef.current);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (credits < 3) {
      alert("Nemáte dostatek kreditů. Potřebujete 3 kredity.");
      return;
    }

    setLoading(true);
    try {
      const audioUrl = await voiceService.uploadAudio(file);
      
      await voiceService.createVoiceConversation({
        provider: provider,
        audio_url: audioUrl,
        transcript: "Transcription placeholder (v reálné aplikaci by zde bylo volání API pro převod řeči na text)",
      });

      const newCredits = await creditsService.deductCredits(3);
      setCredits(newCredits);

      await loadMessages();
      setActiveTab("history");
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Chyba při zpracování zvuku.");
    } finally {
      setLoading(false);
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
              <TabsTrigger value="live">
                <Radio className="h-4 w-4 mr-2" />
                Živý chat
              </TabsTrigger>
              <TabsTrigger value="history">
                <MessageSquare className="h-4 w-4 mr-2" />
                Historie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Radio className="h-5 w-5 text-primary" />
                      Živý hlasový chat
                    </CardTitle>
                    <CardDescription>
                      Konverzujte s AI v reálném čase. Mluvte a AI vám okamžitě odpoví hlasem. (3 kredity za zprávu)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center py-8 space-y-6">
                        {/* Status indikátor */}
                        <div className="relative">
                          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                            isLiveActive 
                              ? isListening 
                                ? "bg-accent/20 animate-pulse" 
                                : isSpeaking 
                                  ? "bg-primary/20 animate-pulse" 
                                  : "bg-muted"
                              : "bg-muted"
                          }`}>
                            {isListening && (
                              <Mic className="h-16 w-16 text-accent" />
                            )}
                            {isSpeaking && (
                              <Volume2 className="h-16 w-16 text-primary animate-pulse" />
                            )}
                            {!isLiveActive && (
                              <MicOff className="h-16 w-16 text-muted-foreground" />
                            )}
                          </div>
                          {isLiveActive && (
                            <div className="absolute -bottom-2 -right-2">
                              <Badge variant="default" className="bg-accent">
                                <Radio className="h-3 w-3 mr-1 animate-pulse" />
                                LIVE
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Status text */}
                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold">
                            {!isLiveActive && "Vypnuto"}
                            {isListening && "Poslouchám..."}
                            {isSpeaking && "AI mluví..."}
                            {isLiveActive && !isListening && !isSpeaking && "Připraveno"}
                          </p>
                          {liveTranscript && (
                            <p className="text-sm text-muted-foreground italic">
                              "{liveTranscript}"
                            </p>
                          )}
                        </div>

                        {/* Control button */}
                        <Button
                          size="lg"
                          onClick={toggleLiveChat}
                          className={isLiveActive ? "bg-destructive hover:bg-destructive/90" : ""}
                        >
                          {isLiveActive ? (
                            <>
                              <StopCircle className="h-5 w-5 mr-2" />
                              Ukončit chat
                            </>
                          ) : (
                            <>
                              <Play className="h-5 w-5 mr-2" />
                              Zahájit živý chat
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Nastavení */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                          <Label>AI Provider</Label>
                          <Select value={provider} onValueChange={(v) => setProvider(v as VoiceProvider)} disabled={isLiveActive}>
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

                        <div className="space-y-2">
                          <Label>Typ hlasu</Label>
                          <Select value={voiceType} onValueChange={setVoiceType} disabled={isLiveActive}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VOICE_TYPES.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.name} ({v.gender})
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
                      Živý přepis vaší konverzace s AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {conversation.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Zatím žádná konverzace. Zahajte živý chat a začněte mluvit.
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
                  <CardTitle className="text-sm">💡 Tipy pro živý chat</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Mluvte zřetelně a s pauzami mezi větami</p>
                  <p>• Čekejte až AI dokončí svou odpověď než mluvíte znovu</p>
                  <p>• Používejte v tichém prostředí pro nejlepší výsledky</p>
                  <p>• Každá zpráva stojí 3 kredity (vaše otázka + AI odpověď)</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Historie nahrávek</CardTitle>
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
                                <p className="text-sm text-muted-foreground">
                                  {message.transcript}
                                </p>
                                <div className="flex gap-2 mt-3">
                                  <Badge variant="secondary">
                                    {VOICE_PROVIDERS.find(p => p.id === message.provider)?.name}
                                  </Badge>
                                  <Badge variant="secondary">
                                    Hlasová konverzace
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
        </main>
      </div>
    </AuthGuard>
  );
}