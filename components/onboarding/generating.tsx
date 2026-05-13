import { Card, CardContent } from "@/components/ui/card";

interface Props {
  message?: string;
}

export function Generating({ message = "Готуємо твій профіль..." }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
