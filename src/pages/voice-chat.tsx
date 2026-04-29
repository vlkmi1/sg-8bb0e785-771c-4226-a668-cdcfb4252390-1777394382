import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Trash2, MessageSquare, Menu, Home, Plus } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { UserMenu } from "@/components/UserMenu";
import { ChatMessage } from "@/components/ChatMessage";
import { creditsService } from "@/services/creditsService";
import { voiceService, type VoiceChat } from "@/services/voiceService";
import { toast } from "@/hooks/use-toast";

export default function VoiceChat() {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<VoiceChat[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<VoiceChat | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    try {
      const [userCredits, chats] = await Promise.all([
        creditsService.getCredits(),
        voiceService.getVoiceConversations(),
      ]);
      setCredits(userCredits);
      setConversations(chats);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleNewConversation = async () => {
    try {
      // V aktuálním flow pro voice chat spíše tvoříme nové konverzace přímo při processAudio
      setSelectedConversation(null);
      setMessages([]);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error setting new conversation:", error);
    }
  };

  const handleSelectConversation = async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setSelectedConversation(conv);
      setMenuOpen(false);
      
      // Pro zjednodušení si ukážeme pouze historii dané jedné vybrané hlasové konverzace
      try {
        const msgs = [];
        if (conv.transcript) msgs.push({ role: "user", content: conv.transcript });
        if (conv.response_text) msgs.push({ role: "assistant", content: conv.response_text });
        setMessages(msgs);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await voiceService.deleteVoiceConversation(id);
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
        setMessages([]);
      }
      await loadData();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat konverzaci",
        variant: "destructive",
      });
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
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se spustit nahrávání. Povolte přístup k mikrofonu.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const data = await voiceService.processVoiceMessage(base64Audio, "openai");

      // Add user message
      const userMessage = {
        role: "user",
        content: data.transcript,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Add assistant message
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Play audio response
      if (data.audioUrl) {
        await playAudio(data.audioUrl);
      }

      await loadData();
      
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zpracovat audio",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (audioUrl: string) => {
    try {
      setIsSpeaking(true);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsSpeaking(false);
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsSpeaking(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <AuthGuard>
      {/* Mobile/PWA Fullscreen Layout */}
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            {/* Menu Button */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="font-heading">Hlasové konverzace</SheetTitle>
                </SheetHeader>
                
                {/* New Chat Button */}
                <div className="p-3 border-b">
                  <Button onClick={handleNewConversation} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nový hlasový chat
                  </Button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Žádné konverzace
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation?.id === conv.id ? "bg-muted" : ""
                          }`}
                        >
                          <Mic className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Close Button */}
                <div className="p-4 border-t bg-muted/30">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setMenuOpen(false)}
                  >
                    Zavřít a pokračovat v chatu
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Dashboard Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Side - User Menu */}
          <UserMenu credits={credits} showCredits={false} />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 mx-auto">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">
                  Hlasový chat
                </h2>
                <p className="text-muted-foreground">
                  Stiskněte mikrofon a začněte mluvit
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role as any} content={msg.content} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Zpracovávám...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Voice Controls Area */}
        <div className="border-t bg-card px-4 py-6 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-4">
              {/* Recording Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading || isSpeaking}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-destructive hover:bg-destructive/90 scale-110"
                    : "bg-primary hover:bg-primary/90"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-8 w-8 text-white" />
                ) : (
                  <Mic className="h-8 w-8 text-white" />
                )}
                
                {isRecording && (
                  <span className="absolute -inset-1 rounded-full border-4 border-destructive animate-ping" />
                )}
              </button>

              {/* Status Text */}
              <div className="text-center">
                {isRecording && (
                  <p className="text-sm font-medium text-destructive animate-pulse">
                    Nahrávám...
                  </p>
                )}
                {loading && (
                  <p className="text-sm font-medium text-muted-foreground">
                    Zpracovávám hlasový vstup...
                  </p>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-primary">
                    <Volume2 className="h-4 w-4 animate-pulse" />
                    <p className="text-sm font-medium">AI mluví...</p>
                  </div>
                )}
                {!isRecording && !loading && !isSpeaking && (
                  <p className="text-sm text-muted-foreground">
                    Stiskněte mikrofon pro nahrávání
                  </p>
                )}
              </div>

              {/* Cost Info */}
              <p className="text-xs text-muted-foreground">
                3 kredity za zprávu
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}