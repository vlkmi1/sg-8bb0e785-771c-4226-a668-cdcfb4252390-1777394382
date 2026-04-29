import { Coins } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { UserMenu } from "@/components/UserMenu";

interface ModuleHeaderProps {
  credits?: number;
}

export function ModuleHeader({ credits }: ModuleHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            kAIkus
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {credits !== undefined && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{credits} kreditů</span>
            </div>
          )}
          <ThemeSwitch />
          <UserMenu credits={credits} showCredits={false} />
        </div>
      </div>
    </header>
  );
}