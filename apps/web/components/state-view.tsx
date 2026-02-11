import { Card, CardContent } from "@/components/ui/card";

export function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-sm text-destructive">{message}</CardContent>
    </Card>
  );
}
