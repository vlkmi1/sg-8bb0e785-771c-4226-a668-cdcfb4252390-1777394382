import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Send, Loader2, Menu, Home, Plus, Trash2, Bot } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { UserMenu } from "@/components/UserMenu";
import { ChatMessage } from "@/components/ChatMessage";
import { creditsService } from "@/services/creditsService";
import { assistantService } from "@/services/assistantService";
import { toast } from "@/hooks/use-toast";

export default function AssistantChat() {
  const router = useRouter();
  const { id: assistantId } = router.query;
  
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [assistant, setAssistant] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assistantId) {
      loadData();
    }
  }, [assistantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    if (!assistantId || typeof assistantId !== "string") return;

    try {
      const [userCredits, assistantData, convData] = await Promise.all([
        creditsService.getCredits(),
        assistantService.getAssistant(assistantId),
        assistantService.getConversation(assistantId),
      ]);

      setCredits(userCredits);
      setAssistant(assistantData);
      
      // Pro Assistant API máme jednu konverzaci per asistent per uživatel
      if (convData) {
        setConversations([convData]);
        setSelectedConversation(convData);
        setMessages((convData.messages as any[]) || []);
      } else {
        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleNewConversation = async () => {
    if (!assistantId || typeof assistantId !== "string") return;

    try {
      // Pokud už konverzace existuje, pouze ji promažeme
      if (selectedConversation) {
        await assistantService.clearConversation(selectedConversation.id);
      } else {
        await assistantService.createConversation(assistantId);
      }

      await loadData();
      setMenuOpen(false);
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit konverzaci",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = async (id: string) => {
    // V aktuálním schématu máme jen jednu konverzaci
    setMenuOpen(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await assistantService.clearConversation(id);
      await loadData();
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat konverzaci",
        variant: "destructive",
      });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !assistantId) return;

    if (!selectedConversation) {
      await handleNewConversation();
      return;
    }

    const userMessage = {
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantId,
          conversationId: selectedConversation.id,
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error("Chyba při komunikaci s API");
      }

      const data = await response.json();
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCredits(data.remainingCredits || credits);
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odeslat zprávu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!assistantId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                  <SheetTitle className="font-heading flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {assistant?.name || "AI Asistent"}
                  </SheetTitle>
                </SheetHeader>
                
                {/* New Chat Button */}
                <div className="p-3 border-b">
                  <Button onClick={handleNewConversation} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nová konverzace
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
                          <Bot className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
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
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">
                  {assistant?.name || "AI Asistent"}
                </h2>
                <p className="text-muted-foreground">
                  {assistant?.description || "Začněte konverzaci s AI asistentem"}
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
                  <span>AI přemýšlí...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-card px-4 py-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Napište zprávu..."
                className="min-h-[60px] pr-12 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}