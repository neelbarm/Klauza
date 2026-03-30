import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { user, login, register } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Error", description: "Username and password are required", variant: "destructive" });
      return;
    }
    if (isLogin) {
      login.mutate({ username, password }, {
        onError: (err: any) => {
          toast({ title: "Login failed", description: err.message || "Invalid credentials", variant: "destructive" });
        },
      });
    } else {
      register.mutate({ username, password, fullName: fullName || undefined }, {
        onError: (err: any) => {
          toast({ title: "Registration failed", description: err.message || "Could not create account", variant: "destructive" });
        },
      });
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen flex" data-testid="auth-page">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">K</span>
              </div>
              <span className="font-display text-sm tracking-[0.25em]">KLAUZA</span>
            </div>
            <CardTitle className="text-lg">{isLogin ? "Welcome back" : "Create your account"}</CardTitle>
            <CardDescription className="text-sm">
              {isLogin ? "Sign in to your Klauza account" : "Start protecting your freelance income"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    data-testid="input-fullname"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isPending}
                data-testid="button-auth-submit"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="button-toggle-auth"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Brand panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12" style={{ backgroundColor: '#141412' }}>
        <div className="max-w-md">
          <h2 className="font-display text-3xl uppercase text-white leading-tight mb-4">
            SCAN. PROTECT.{" "}
            <span className="text-primary">GET PAID.</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            One platform to manage contracts, track clients, send invoices, and enforce payments.
            Built for freelancers who refuse to get stiffed.
          </p>
          <div className="space-y-3">
            {[
              "AI-powered contract scanning in 37 seconds",
              "4-stage automated enforcement pipeline",
              "Real-time client risk scoring",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-white/60">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
