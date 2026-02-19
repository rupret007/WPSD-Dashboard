import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <AppHeader />

      <main className="space-y-8">
        <Dashboard />
        <Link href="/live-traffic" className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Live Traffic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View recent MMDVM log activity. Click to open full table.
              </p>
            </CardContent>
          </Card>
        </Link>
      </main>
    </div>
  );
}
