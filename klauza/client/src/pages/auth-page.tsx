import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { Redirect } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Plan definitions
const PLANS = [
  {
    id: "free",
    name: "Free Trial",
    price: "$0",
    period: "/mo",
    description: "Get started risk-free",
    features: [
      "1 contract scan",
      "2 clients",
      "1 invoice",
      "Basic dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$80",
    period: "/mo",
    description: "For independent freelancers",
    featured: true,
    features: [
      "Unlimited contracts",
      "Unlimited clients",
      "Unlimited invoices",
      "4-stage enforcement",
      "Demand letter generation",
      "AI contract scanning",
      "Full analytics dashboard",
      "Email support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$350",
    period: "/mo",
    description: "For agencies & teams",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "API access",
      "Custom branding",
      "Priority support",
      "Dedicated account manager",
      "Bulk contract upload",
      "Advanced analytics",
    ],
  },
];

const ARR_OPTIONS = [
  { value: "<50k", label: "< $50K" },
  { value: "50k-100k", label: "$50K – $100K" },
  { value: "100k-250k", label: "$100K – $250K" },
  { value: "250k-500k", label: "$250K – $500K" },
  { value: "500k+", label: "$500K+" },
];

const REFERRAL_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "reddit", label: "Reddit" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "other", label: "Other" },
];

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center p-12" style={{ backgroundColor: "#141412" }}>
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
  );
}

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">K</span>
      </div>
      <span className="font-display text-sm tracking-[0.25em]">KLAUZA</span>
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              i + 1 < current
                ? "bg-primary text-primary-foreground"
                : i + 1 === current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1 < current ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i + 1 < current ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">Step {current} of {total}</span>
    </div>
  );
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Onboarding step state
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [estimatedArr, setEstimatedArr] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");

  const { user, login, register } = useAuth();
  const { toast } = useToast();

  const onboardingMutation = useMutation({
    mutationFn: async (data: { businessName: string; estimatedArr: string; referralSource: string; plan: string }) => {
      const res = await apiRequest("POST", "/api/onboarding", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Could not complete onboarding", variant: "destructive" });
    },
  });

  // Mode: user is logged in and either onboarding complete OR is admin → go to dashboard
  if (user && (user.onboardingComplete === 1 || (user as any).role === 'admin')) {
    return <Redirect to="/dashboard" />;
  }

  // Mode B: logged in but onboarding not complete (regular users only)
  if (user && !user.onboardingComplete) {
    const handleStep1Next = (e: React.FormEvent) => {
      e.preventDefault();
      if (!businessName || !estimatedArr || !referralSource) {
        toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
        return;
      }
      setOnboardingStep(2);
    };

    const handleStep2Submit = (e: React.FormEvent) => {
      e.preventDefault();
      onboardingMutation.mutate({ businessName, estimatedArr, referralSource, plan: selectedPlan });
    };

    return (
      <div className="min-h-screen flex" data-testid="onboarding-page">
        {/* Left: Onboarding Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg">
            <Logo />
            <StepIndicator current={onboardingStep} total={2} />

            {onboardingStep === 1 && (
              <div>
                <h1 className="text-xl font-semibold mb-1">Tell us about your business</h1>
                <p className="text-sm text-muted-foreground mb-6">Help us personalize Klauza for your needs.</p>
                <form onSubmit={handleStep1Next} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm">Business Name</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your business or freelance name"
                      data-testid="input-business-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedArr" className="text-sm">Estimated Annual Revenue</Label>
                    <Select value={estimatedArr} onValueChange={setEstimatedArr}>
                      <SelectTrigger data-testid="select-arr">
                        <SelectValue placeholder="Select revenue range" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referralSource" className="text-sm">Where did you find us?</Label>
                    <Select value={referralSource} onValueChange={setReferralSource}>
                      <SelectTrigger data-testid="select-referral">
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERRAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-step1-next">
                    Continue
                  </Button>
                </form>
              </div>
            )}

            {onboardingStep === 2 && (
              <div>
                <h1 className="text-xl font-semibold mb-1">Choose your plan</h1>
                <p className="text-sm text-muted-foreground mb-6">You can upgrade or change your plan at any time.</p>
                <form onSubmit={handleStep2Submit}>
                  <div className="space-y-3 mb-6">
                    {PLANS.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPlan === plan.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                        data-testid={`plan-card-${plan.id}`}
                      >
                        {plan.featured && (
                          <span className="absolute -top-2.5 left-4 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-display tracking-widest uppercase">
                            Popular
                          </span>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-lg">{plan.price}</span>
                            <span className="text-xs text-muted-foreground">{plan.period}</span>
                          </div>
                        </div>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-primary shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {selectedPlan === plan.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setOnboardingStep(1)}
                      data-testid="button-step2-back"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={onboardingMutation.isPending}
                      data-testid="button-step2-start"
                    >
                      {onboardingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Start {PLANS.find((p) => p.id === selectedPlan)?.name}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        <BrandPanel />
      </div>
    );
  }

  // Mode A: Not logged in — show login/register
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
      register.mutate({ username, password, fullName: fullName || undefined, email: email || undefined }, {
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
          <CardContent className="pt-6">
            <Logo />
            <h1 className="text-lg font-semibold text-center mb-1">{isLogin ? "Welcome back" : "Create your account"}</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {isLogin ? "Sign in to your Klauza account" : "Start protecting your freelance income"}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      data-testid="input-email"
                    />
                  </div>
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
                </>
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

      <BrandPanel />
    </div>
  );
}
