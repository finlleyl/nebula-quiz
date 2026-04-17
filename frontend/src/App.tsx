import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-3xl">
            Enter The Nebula.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="ROOM CODE"
            className="font-mono tracking-widest text-center"
          />
          <Button className="w-full">Enter Room</Button>
        </CardContent>
      </Card>
    </main>
  );
}
