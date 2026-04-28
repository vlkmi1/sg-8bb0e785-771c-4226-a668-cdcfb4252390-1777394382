import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Coins, Home } from "lucide-react";

interface ModuleHeaderProps {
  credits?: number;
  showBackButton?: boolean;
}

export function ModuleHeader({ credits, showBackButton = true }: ModuleHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Credits Display */}
          {typeof credits === "number" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/credits")}
              className="gap-2"
            >
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{credits}</span>
              <span className="text-muted-foreground">kreditů</span>
            </Button>
          )}

          {/* Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Nastavení
          </Button>
        </div>
      </div>
    </header>
  );
}