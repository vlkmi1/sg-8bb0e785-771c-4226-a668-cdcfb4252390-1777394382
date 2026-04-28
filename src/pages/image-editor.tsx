import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  ImageIcon, Wand2, Sparkles, Trash2, Maximize2, LogOut, ArrowLeft, Download, Coins, Brush, Eraser, Undo
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { supabase } from "@/integrations/supabase/client";
import { imageEditService, type EditType } from "@/services/imageEditService";
import { creditsService } from "@/services/creditsService";
import { useToast } from "@/hooks/use-toast";
import { ModuleHeader } from "@/components/ModuleHeader";

export default function ImageEditor() {
  const router = useRouter();
  const { imageUrl, imageId } = router.query;
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  
  const [editType, setEditType] = useState<EditType>("inpaint");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"openai" | "stability">("openai");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");

  useEffect(() => {
    loadCredits();
    if (imageUrl && typeof imageUrl === "string") {
      setOriginalImage(imageUrl);
      loadImageToCanvas(imageUrl);
    }
  }, [imageUrl]);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadImageToCanvas = (url: string) => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    };
    img.src = url;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas?.getContext("2d");
    if (maskCtx) {
      maskCtx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown") return;

    const maskCanvas = maskCanvasRef.current;
    const canvas = canvasRef.current;
    if (!maskCanvas || !canvas) return;

    const maskCtx = maskCanvas.getContext("2d");
    const ctx = canvas.getContext("2d");
    if (!maskCtx || !ctx) return;

    const rect = maskCanvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Draw on mask canvas
    maskCtx.lineCap = "round";
    maskCtx.lineJoin = "round";
    maskCtx.lineWidth = brushSize;
    
    if (tool === "brush") {
      maskCtx.strokeStyle = "white";
      maskCtx.globalCompositeOperation = "source-over";
      
      // Visual feedback on main canvas
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = brushSize;
    } else {
      maskCtx.strokeStyle = "black";
      maskCtx.globalCompositeOperation = "source-over";
      
      // Clear visual feedback
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize;
    }

    maskCtx.lineTo(x, y);
    maskCtx.stroke();
    maskCtx.beginPath();
    maskCtx.moveTo(x, y);

    // Visual feedback
    if (tool === "brush") {
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    // Clear and reload original image
    loadImageToCanvas(originalImage);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();

    if (credits < 3) {
      toast({
        title: "Nedostatek kreditů",
        description: "Editace obrázku stojí 3 kredity.",
        variant: "destructive",
      });
      return;
    }

    if (editType === "inpaint" && !prompt.trim()) {
      toast({
        title: "Chybí prompt",
        description: "Pro inpainting musíte zadat popis úpravy.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const maskCanvas = maskCanvasRef.current;
      let maskData = undefined;

      if (editType === "inpaint" && maskCanvas) {
        maskData = maskCanvas.toDataURL("image/png");
      }

      const loadingToast = toast({
        title: "Editace obrázku...",
        description: "To může trvat 15-30 sekund.",
        duration: 30000,
      });

      const edit = await imageEditService.editImage({
        originalImageUrl: originalImage,
        originalImageId: typeof imageId === "string" ? imageId : undefined,
        editType,
        prompt: prompt.trim() || undefined,
        maskData,
        model,
      });

      loadingToast.dismiss();

      setEditedImage(edit.edited_image_url);
      const newCredits = await creditsService.getCredits();
      setCredits(newCredits);

      toast({
        title: "Úspěch!",
        description: "Obrázek byl úspěšně editován",
      });
    } catch (error: any) {
      console.error("Edit error:", error);
      toast({
        title: "Chyba při editaci",
        description: error.message || "Nepodařilo se editovat obrázek",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <ModuleHeader credits={credits} />

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Editor Controls */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Nástroje editace</CardTitle>
                  <CardDescription>Vyberte typ úpravy a nastavení</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Typ editace</Label>
                    <Select value={editType} onValueChange={(v) => setEditType(v as EditType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inpaint">
                          <div className="flex items-center gap-2">
                            <Brush className="h-4 w-4" />
                            Inpainting
                          </div>
                        </SelectItem>
                        <SelectItem value="variation">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Variace
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editType === "inpaint" && (
                    <>
                      <div className="space-y-2">
                        <Label>Nástroj</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={tool === "brush" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTool("brush")}
                            className="flex-1"
                          >
                            <Brush className="h-4 w-4 mr-2" />
                            Štětec
                          </Button>
                          <Button
                            variant={tool === "eraser" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTool("eraser")}
                            className="flex-1"
                          >
                            <Eraser className="h-4 w-4 mr-2" />
                            Guma
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Velikost štětce: {brushSize}px</Label>
                        <Slider
                          value={[brushSize]}
                          onValueChange={(v) => setBrushSize(v[0])}
                          min={10}
                          max={100}
                          step={5}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearMask}
                        className="w-full"
                      >
                        <Undo className="h-4 w-4 mr-2" />
                        Vymazat masku
                      </Button>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select value={model} onValueChange={(v) => setModel(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">DALL-E 2</SelectItem>
                        <SelectItem value="stability">Stability AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editType !== "variation" && (
                    <div className="space-y-2">
                      <Label>Popis úpravy</Label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Popište jak má být obrázek upraven..."
                        rows={4}
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleEdit}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generování...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Editovat (3 kredity)
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Inpainting:</strong> Označte oblast štětcem a AI ji upraví podle popisu</p>
                    <p><strong>Variace:</strong> AI vytvoří podobnou verzi obrázku</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Canvas Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Editační plátno</CardTitle>
                  <CardDescription>
                    {editType === "inpaint" 
                      ? "Nakreslete štětcem oblast, kterou chcete upravit"
                      : "Náhled původního obrázku"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden bg-muted/5">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={editType === "inpaint" ? startDrawing : undefined}
                      onMouseMove={editType === "inpaint" ? draw : undefined}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full h-auto cursor-crosshair"
                      style={{ maxHeight: "600px" }}
                    />
                    <canvas
                      ref={maskCanvasRef}
                      className="hidden"
                    />
                    {!originalImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Žádný obrázek není načten</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {editedImage && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-heading">Upravený obrázek</CardTitle>
                        <CardDescription>Váš AI editovaný výsledek</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(editedImage, "edited-image.png")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Stáhnout
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={editedImage}
                      alt="Edited"
                      className="w-full h-auto rounded-lg border"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}