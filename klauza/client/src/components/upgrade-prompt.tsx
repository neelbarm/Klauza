import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function UpgradePrompt({ feature, current, limit }: { feature: string; current: number; limit: number }) {
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upgrade");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    },
  });

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">{limit === 0 ? "Pro Feature" : "Free Plan Limit Reached"}</CardTitle>
        <CardDescription>
          {limit === 0
            ? `The ${feature} feature is only available on the Pro plan. Upgrade to unlock it.`
            : `You've used ${current} of ${limit} ${feature} on the free plan. Upgrade to Pro for unlimited access.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-4">
          <span className="text-3xl font-bold text-primary">$80</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 mb-6">
          <li>✓ Unlimited contracts & templates</li>
          <li>✓ Unlimited invoices & clients</li>
          <li>✓ Full Chase enforcement engine</li>
          <li>✓ Growth dashboard & analytics</li>
        </ul>
        <Button
          onClick={() => upgradeMutation.mutate()}
          disabled={upgradeMutation.isPending}
          className="w-full"
          size="lg"
        >
          <Zap className="mr-2 h-4 w-4" />
          {upgradeMutation.isPending ? "Upgrading..." : "Upgrade to Pro — $80/mo"}
        </Button>
      </CardContent>
    </Card>
  );
}
