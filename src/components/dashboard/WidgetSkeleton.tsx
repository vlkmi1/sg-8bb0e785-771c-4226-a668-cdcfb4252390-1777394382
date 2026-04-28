import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CreditsWidgetSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-16 gap-1">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-full" />
          ))}
        </div>
        <Skeleton className="w-full h-10 mt-4" />
      </CardContent>
    </Card>
  );
}

export function QuickActionsWidgetSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentActivityWidgetSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="w-4 h-4 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardsWidgetSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Skeleton className="w-5 h-5 rounded" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TabletCreditsWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-24 mb-6" />
            <Skeleton className="w-full h-12" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <div className="flex items-end justify-between h-32 gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="flex-1 h-full" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TabletQuickActionsWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TabletRecentActivityWidgetSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 p-3 flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`p-3 flex gap-4 ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TabletStatsCardsWidgetSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="w-8 h-8 rounded" />
            </div>
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}