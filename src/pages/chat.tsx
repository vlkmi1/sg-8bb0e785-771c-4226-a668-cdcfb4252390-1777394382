import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Brain, Send, LogOut, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { conversationsService, type Message } from "@/services/conversationsService";
import { apiKeysService, type AIProvider } from "@/services/apiKeysService";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "google", name: "Google AI" },
  { id: "mistral", name: "Mistral AI" },
  { id: "cohere", name: "Cohere" },
];

export default function Chat() {
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("openai");
  const [connectedProviders, setConnectedProviders] = useState<AIProvider[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConnectedProviders();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConnectedProviders = async () => {
    try {
      const keys = await apiKeysService.getApiKeys();
      setConnectedProviders(keys.map(k => k.provider));
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversationId) return;
    
    try {
      const data = await conversationsService.getMessages(selectedConversationId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleNewConversation = () => {
    if (connectedProviders.length === 0) {
      router.push("/");
      return;
    }
    setShowNewConversationDialog(true);
  };

  const handleCreateConversation = async () => {
    if (!newConvTitle.trim()) return;

    try {
      const conversation = await conversationsService.createConversation({
        title: newConvTitle,
        model_provider: selectedProvider,
      });
      setSelectedConversationId(conversation.id);
      setNewConvTitle("");
      setShowNewConversationDialog(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedConversationId) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setLoading(true);

    try {
      await conversationsService.createMessage({
        conversation_id: selectedConversationId,
        role: "user",
        content: userMessage,
      });

      const assistantResponse = `Toto je simulovaná odpověď od AI modelu. V plné verzi by zde byla skutečná odpověď z API ${selectedProvider}.`;
      
      await conversationsService.createMessage({
        conversation_id: selectedConversationId,
        role: "assistant",
        content: assistantResponse,
      });

      await loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
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
      <div className="flex h-screen bg-background">
        <div className="w-80 flex-shrink-0">
          <ConversationSidebar
            selectedId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            onNewConversation={handleNewConversation}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">kAIkus Chat</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.push("/")}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {!selectedConversationId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="p-4 bg-primary/10 rounded-full inline-block">
                  <Brain className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold">Vítejte v kAIkus Chat</h2>
                <p className="text-muted-foreground">
                  Začněte novou konverzaci nebo vyberte existující z levého panelu.
                </p>
                <Button onClick={handleNewConversation}>
                  Začít novou konverzaci
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1" ref={scrollRef}>
                <div className="space-y-0">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Konverzace je prázdná. Napište první zprávu.
                    </div>
                  ) : (
                    messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        role={message.role}
                        content={message.content}
                      />
                    ))
                  )}
                  {loading && (
                    <div className="flex gap-4 p-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-secondary text-secondary-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">AI Asistent</p>
                        <p className="text-sm text-muted-foreground mt-2">Píše odpověď...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t bg-card p-4">
                <div className="container max-w-4xl">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Napište zprávu..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="resize-none min-h-[60px]"
                      rows={2}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={loading || !inputMessage.trim()}
                      size="icon"
                      className="h-[60px] w-[60px]"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Nová konverzace</DialogTitle>
              <DialogDescription>
                Vytvořte novou konverzaci s AI modelem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Název konverzace</Label>
                <Input
                  id="title"
                  placeholder="např. Pomoc s programováním"
                  value={newConvTitle}
                  onChange={(e) => setNewConvTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">AI Model</Label>
                <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as AIProvider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.filter(p => connectedProviders.includes(p.id as AIProvider)).map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateConversation} className="w-full" disabled={!newConvTitle.trim()}>
                Vytvořit konverzaci
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}