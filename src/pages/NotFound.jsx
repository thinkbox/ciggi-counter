import { CircleAlert } from "lucide-react";
import { Card } from "../components/ui.jsx";

export function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <Card className="mx-4 w-full max-w-md">
        <div className="pt-6 p-6">
          <div className="mb-4 flex gap-2">
            <CircleAlert className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">That page does not exist.</p>
        </div>
      </Card>
    </div>
  );
}
