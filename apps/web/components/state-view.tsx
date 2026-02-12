import { AlertTriangle, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <Card className="border-primary/20 bg-card/90">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Preparando vista
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-28 w-full" />
      </CardContent>
    </Card>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-destructive/40 bg-destructive/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Error de carga
        </CardTitle>
        <CardDescription className="text-destructive/80">No pudimos completar esta operación.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-destructive">{message}</CardContent>
    </Card>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
