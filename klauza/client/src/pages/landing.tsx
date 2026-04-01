import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  FileText,
  Shield,
  AlertTriangle,
  Search,
  Zap,
  Clock,
  Eye,
  FileCheck,
  Scale,
  X,
  DollarSign,
  FileWarning,
  Package,
  ChevronRight,
  Menu,
  X as XIcon,
  Bot,
  Sparkles,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Product", id: "product" },
    { label: "How It Works", id: "how-it-works" },
    { label: "Protection", id: "protection" },
    { label: "Pricing", id: "pricing" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">K</span>
          </div>
          <span className="font-display text-sm tracking-[0.3em] text-foreground">K L A U Z A</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-5 h-9">
              Scan a Contract
            </Button>
          </Link>
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-3">
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 h-8">
              Scan
            </Button>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="block w-full text-left py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-border mt-2">
              <Link href="/auth" className="block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/auth" className="block mt-1">
                <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-10">
                  Scan a Contract
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. HERO — Prevent + Recover
// ═══════════════════════════════════════════════════════════
function HeroSection() {
  return (
    <section className="pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-display tracking-[0.3em] text-primary uppercase mb-6">
          Freelancer protection infrastructure
        </p>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] uppercase leading-[1.12] tracking-tight max-w-3xl mx-auto">
          Scan before signing.{" "}
          <span className="text-primary">Chase when they stall.</span>
        </h1>

        <p className="mt-6 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Klauza AI flags risky contract clauses, strengthens your agreements, generates escalation letters for overdue payments, and organizes disputes before legal escalation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-sm font-medium">
              Scan a Contract
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              variant="outline"
              className="rounded-full px-8 h-12 text-sm border-border"
            >
              Start a Dispute
            </Button>
          </Link>
        </div>

        {/* Hero proof bullets */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            "Flag risky clauses fast",
            "Build stronger freelancer protection",
            "Chase overdue payments",
            "Organize dispute evidence clearly",
          ].map((b) => (
            <div key={b} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">{b}</span>
            </div>
          ))}
        </div>

        {/* Hero product visual — dual panel */}
        <div className="mt-12 max-w-2xl mx-auto grid sm:grid-cols-2 gap-3">
          {/* Left: Contract scan result */}
          <div className="p-4 rounded-lg border border-border bg-card text-left">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium">Contract Analysis</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium shrink-0">CRITICAL</span>
                <p className="text-xs text-muted-foreground">No kill fee — client can cancel without compensation</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium shrink-0">HIGH</span>
                <p className="text-xs text-muted-foreground">Payment upon completion only — no deposits or milestones</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium shrink-0">MED</span>
                <p className="text-xs text-muted-foreground">IP transfers immediately — not tied to payment</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Safety Score</p>
              <p className="text-sm font-bold text-red-600">28/100</p>
            </div>
          </div>

          {/* Right: Dispute chase status */}
          <div className="p-4 rounded-lg border border-border bg-card text-left">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium">Dispute Chase</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">Friendly reminder sent</p>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">Day 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">Formal notice with late fees</p>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">Day 14</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-orange-600" />
                </div>
                <p className="text-xs font-medium">Demand letter generated</p>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">Day 30</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground">4</span>
                </div>
                <p className="text-xs text-muted-foreground/50">Court prep ready if needed</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">$4,800 overdue</p>
              <p className="text-xs font-medium text-orange-600">37 days</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 1b. PROOF BAR — Specific, AI-powered outcomes
// ═══════════════════════════════════════════════════════════
function ProofBar() {
  const items = [
    { icon: Search, text: "Klauza AI scans 17 risk categories per contract" },
    { icon: Shield, text: "AI-generated clauses for kill fees, IP, and payment" },
    { icon: Zap, text: "AI demand letters cite your terms and jurisdiction law" },
    { icon: Sparkles, text: "1 free scan — no credit card required" },
  ];

  return (
    <section className="py-6 border-y border-border bg-card">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((item) => (
            <div key={item.text} className="flex items-start gap-2.5">
              <item.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-foreground/80 font-medium leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. COST OF THE PROBLEM
// ═══════════════════════════════════════════════════════════
function CostOfProblem() {
  const costs = [
    { text: "Vague contract terms create avoidable disputes that drain your time and leverage." },
    { text: "Missing payment protections leave you exposed when a client decides not to pay." },
    { text: "Chasing late invoices manually is slow, awkward, and easy to deprioritize." },
    { text: "Scattered evidence makes escalation harder when you finally need to act." },
    { text: "Lawyers are expensive — especially if you show up unprepared." },
  ];

  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">The Real Cost</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight text-white mb-4">
          Weak contracts and late payments{" "}
          <span className="text-primary">cost freelancers real money.</span>
        </h2>
        <p className="text-sm text-white/40 mb-10 max-w-xl mx-auto">
          Most freelancers don't lose money because of bad work. They lose it because of bad terms, slow enforcement, and no system for what happens when a client stops paying.
        </p>
        <div className="max-w-xl mx-auto space-y-3 text-left">
          {costs.map((c, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/5" style={{ backgroundColor: '#1e1d1a' }}>
              <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
              <p className="text-sm text-white/60 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. TWO MOMENTS FREELANCERS GET BURNED
// ═══════════════════════════════════════════════════════════
function TwoMoments() {
  const beforeSigning = [
    "Vague scope that invites scope creep",
    "Weak payment terms with no deposit requirement",
    "Missing kill fee if the client cancels",
    "Bad termination language with no notice period",
    "IP ownership that transfers before you're paid",
  ];

  const afterDelivery = [
    "Invoices go past due with no enforcement path",
    "Client goes silent — no response to follow-ups",
    "Repeated reminders that feel awkward and get ignored",
    "No structured escalation workflow to follow",
    "Legal next steps that feel expensive and overwhelming",
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Where It Breaks Down</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight mb-4">
          Two moments{" "}
          <span className="text-primary">freelancers get burned.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
          The risk isn't bad clients. It's signing without reviewing and having no system when payment breaks down.
        </p>

        <div className="grid md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
          {/* Before signing */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <FileWarning className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="font-display text-xs uppercase tracking-wider">Before Signing</h3>
            </div>
            <ul className="space-y-2.5">
              {beforeSigning.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <X className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* After delivery */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="font-display text-xs uppercase tracking-wider">After Delivery</h3>
            </div>
            <ul className="space-y-2.5">
              {afterDelivery.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <X className="h-3.5 w-3.5 text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. HOW KLAUZA WORKS — Three steps
// ═══════════════════════════════════════════════════════════
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Klauza AI scans the contract",
      desc: "Upload any agreement. Klauza AI analyzes it across 17 risk categories and flags exactly what needs fixing — weak payment terms, missing kill fees, vague scope, IP traps, and more.",
      icon: Search,
    },
    {
      num: "02",
      title: "Klauza AI chases the payment",
      desc: "If a client goes past due, Klauza AI generates escalating follow-ups — from a professional reminder to a formal demand letter that cites your contract terms and jurisdiction-specific law.",
      icon: Zap,
    },
    {
      num: "03",
      title: "Escalate with a lawyer-ready case file",
      desc: "Invoices, contracts, email records, timeline, and calculated damages — organized into one clean file so you show up fully prepared if legal escalation becomes necessary.",
      icon: Package,
    },
  ];

  return (
    <section className="py-20 px-6 bg-card" id="how-it-works">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">How It Works</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-4 leading-tight">
          AI-powered scan. AI-powered chase.{" "}
          <span className="text-primary">Escalate if needed.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
          Klauza AI handles the two moments freelancers actually lose money: signing weak terms, and having no system when a client stops paying.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-center">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center p-6 rounded-lg border border-border bg-background">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-[10px] text-primary/40 tracking-widest mb-2">{step.num}</span>
              <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. CORE FEATURES — 4 cards
// ═══════════════════════════════════════════════════════════
function CoreFeatures() {
  const features = [
    {
      icon: Search,
      title: "AI Contract Risk Scanner",
      desc: "Upload a contract and Klauza AI analyzes it across 17 risk categories — payment terms, kill fees, IP ownership, scope boundaries, termination language. Get a safety score and specific fix recommendations.",
    },
    {
      icon: FileText,
      title: "AI Contract Builder",
      desc: "Describe your project and Klauza AI writes a complete freelance agreement with built-in kill fees, IP transfer on payment, late penalties, scope boundaries, and jurisdiction-aware legal language.",
    },
    {
      icon: Zap,
      title: "AI Dispute Chase Engine",
      desc: "Klauza AI generates escalation emails, structured follow-ups, and demand letters for overdue invoices. Four stages — friendly reminder, formal notice, demand letter, court preparation.",
    },
    {
      icon: Package,
      title: "Evidence & Escalation Pack",
      desc: "Turn invoices, contracts, email records, screenshots, and timeline into one organized dispute file. If you need a lawyer, you show up with everything ready.",
    },
  ];

  return (
    <section className="py-20 px-6" id="protection" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Powered by Klauza AI</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight text-white mb-4">
          AI contract analysis.{" "}
          <span className="text-primary">AI payment recovery.</span>
        </h2>
        <p className="text-sm text-white/40 mb-12 max-w-xl mx-auto">
          Four AI-powered tools that cover the full lifecycle of freelancer risk — from the contract you sign to the payment you collect.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-5 sm:p-6 rounded-lg border border-white/10"
              style={{ backgroundColor: '#1e1d1a' }}
            >
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-medium text-white text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 5b. PRODUCT SECTION ID ANCHOR
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 6. SAMPLE OUTCOMES — Workflow examples (not fake testimonials)
// ═══════════════════════════════════════════════════════════
function SampleOutcomes() {
  const outcomes = [
    {
      icon: Eye,
      outcome: "Flagged a vague termination clause before signing",
      detail: "The original contract allowed the client to terminate immediately without paying for completed work. Klauza AI caught it and suggested a 14-day notice period with pro-rated payment.",
    },
    {
      icon: AlertTriangle,
      outcome: "Caught a missing kill fee before work started",
      detail: "No cancellation protection on a $6,000 project. The scan recommended a sliding kill fee — 25% if canceled before start, 50% after work begins, 100% after delivery.",
    },
    {
      icon: Clock,
      outcome: "Structured a 37-day overdue invoice chase",
      detail: "Friendly reminder on day 7. Formal notice with late fees on day 14. AI-generated demand letter citing contract terms and state law on day 30. Client paid on day 37.",
    },
    {
      icon: Package,
      outcome: "Turned scattered documents into a lawyer-ready package",
      detail: "Invoices, signed contract, email thread, payment timeline, and calculated damages — organized into one file. The attorney said it was the most prepared client they'd seen.",
    },
  ];

  return (
    <section className="py-20 px-6 bg-card" id="product">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Example Outcomes</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight mb-4">
          What Klauza catches.{" "}
          <span className="text-primary">What Klauza recovers.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl mx-auto">
          Sample workflows showing how Klauza protects freelancers before and after signing.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          {outcomes.map((o) => (
            <div key={o.outcome} className="p-5 rounded-lg border border-border bg-background">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <o.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1.5">{o.outcome}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{o.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 7. DIFFERENTIATION
// ═══════════════════════════════════════════════════════════
function DifferentiationSection() {
  const comparisons = [
    { label: "Templates", desc: "Help you start work", muted: true },
    { label: "Invoicing tools", desc: "Help you send bills", muted: true },
    { label: "Klauza", desc: "Helps you avoid bad contracts and recover leverage when payment breaks down", muted: false },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Why Klauza</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight mb-4">
          Most freelancer tools help manage work.{" "}
          <span className="text-primary">Klauza helps protect it.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-10 max-w-2xl mx-auto">
          Templates help you start. Invoicing tools help you bill. Neither helps when a client sends you a contract with no kill fee, pays 60 days late, or stops responding entirely. Klauza is built for those moments.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {comparisons.map((item) => (
            <div
              key={item.label}
              className={`p-5 rounded-lg border ${item.muted ? "border-border bg-muted/30" : "border-primary/30 bg-primary/5"}`}
            >
              <p className={`text-xs font-display uppercase tracking-wider mb-1.5 ${item.muted ? "text-muted-foreground" : "text-primary"}`}>
                {item.label}
              </p>
              <p className={`text-sm leading-relaxed ${item.muted ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 8. LAWYER-READY, NOT A LAW FIRM
// ═══════════════════════════════════════════════════════════
function LawyerReadySection() {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Important Boundary</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight text-white mb-4">
          Lawyer-ready.{" "}
          <span className="text-primary">Not a law firm.</span>
        </h2>
        <div className="space-y-4 text-sm text-white/50 leading-relaxed max-w-xl mx-auto mb-10">
          <p>
            Klauza is software for contract analysis, recovery workflows, and dispute organization. It is not legal advice and does not replace an attorney.
          </p>
          <p>
            When legal escalation becomes necessary, Klauza helps you export a cleaner, better-prepared case file — so you spend less time getting your lawyer up to speed and more time focused on resolution.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 max-w-xl mx-auto">
          {[
            { label: "Contract analysis", desc: "Flag risks before signing" },
            { label: "Recovery workflows", desc: "Structured payment chase" },
            { label: "Dispute organization", desc: "Lawyer-ready case files" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-lg border border-white/10 text-left" style={{ backgroundColor: '#1e1d1a' }}>
              <p className="text-xs font-medium text-white mb-1">{item.label}</p>
              <p className="text-xs text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 9. PRICING — ROI-framed
// ═══════════════════════════════════════════════════════════
function PricingSection() {
  const proFeatures = [
    "10 AI contract scans per month",
    "17-category risk analysis",
    "AI contract builder with jurisdiction support",
    "Invoice tracking with overdue detection",
    "4-stage payment chase workflow",
    "AI demand letter generation",
    "Evidence organizer for disputes",
    "Client records and risk scoring",
  ];
  const enterpriseFeatures = [
    "Everything in Pro",
    "50 AI contract scans per month",
    "Team collaboration",
    "API access",
    "Custom branding",
    "Priority support",
    "Dedicated account manager",
    "Advanced reporting",
  ];

  return (
    <section className="py-20 px-6 bg-card" id="pricing">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4 text-center">Pricing</p>
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl uppercase mb-3 text-center leading-tight max-w-2xl mx-auto">
          One prevented dispute pays for{" "}
          <span className="text-primary">months of Klauza.</span>
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          One recovered invoice or one caught kill fee clause can return more than a full year of the subscription. Protection that pays for itself.
        </p>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {/* Free */}
          <Card className="p-6 bg-background border-border">
            <div className="mb-6">
              <span className="text-xs font-display tracking-widest text-muted-foreground uppercase">Free</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold">$0</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Try Klauza AI — no card required</p>
            </div>
            <ul className="space-y-2 mb-6">
              {[
                "1 AI contract scan",
                "17-category risk analysis",
                "Safety score + fix recommendations",
                "1 contract creation",
                "1 invoice",
                "2 client records",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth">
              <Button variant="outline" className="w-full rounded-full">
                Scan for Free
              </Button>
            </Link>
          </Card>

          {/* Pro */}
          <Card className="p-6 border-2 border-primary relative" style={{ backgroundColor: '#141412' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-[10px] font-display tracking-wider uppercase px-3 py-1 rounded-full">Most Popular</span>
            </div>
            <div className="mb-6">
              <span className="text-xs font-display tracking-widest text-primary uppercase">Pro</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-white">$80</span>
                <span className="text-sm text-white/50">/mo</span>
              </div>
              <p className="text-xs text-white/40 mt-1">AI scanning + AI chase + recovery</p>
            </div>
            <ul className="space-y-2 mb-6">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-white/70">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth">
              <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                Get Protected
              </Button>
            </Link>
          </Card>

          {/* Enterprise */}
          <Card className="p-6 bg-background border-border">
            <div className="mb-6">
              <span className="text-xs font-display tracking-widest text-muted-foreground uppercase">Enterprise</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold">$350</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">For agencies and teams</p>
            </div>
            <ul className="space-y-2 mb-6">
              {enterpriseFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth">
              <Button variant="outline" className="w-full rounded-full">
                Contact Sales
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 10. FINAL CTA
// ═══════════════════════════════════════════════════════════
function FinalCTA() {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl uppercase text-white leading-tight">
          Scan before signing.{" "}
          <span className="text-primary">Chase when they stall.</span>
        </h2>
        <p className="text-sm text-white/40 mt-4 max-w-xl mx-auto">
          Klauza AI flags risky clauses, strengthens your agreements, and gives you a system to respond when a client stops paying. Start with 1 free scan.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-sm font-medium">
              Scan a Contract
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button
              variant="outline"
              className="rounded-full px-8 h-12 text-sm border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            >
              Start a Dispute
            </Button>
          </Link>
        </div>
        <p className="text-[11px] text-white/25 mt-8">
          Klauza is a self-help tool for freelancers, not a law firm. We do not provide legal advice or representation.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════
function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">K</span>
            </div>
            <span className="font-display text-xs tracking-[0.2em]">KLAUZA</span>
          </div>
          <p className="text-xs text-muted-foreground">Scan before signing.<br />Chase when they stall.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Protection</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Contract Scanner</Link></li>
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Contract Builder</Link></li>
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Dispute Chase</Link></li>
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Evidence Pack</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Company</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            <li><Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
            <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Legal</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">© 2026 Klauza. All rights reserved. Klauza is not a law firm and does not provide legal advice.</p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE COMPOSITION
// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      <Navbar />
      <HeroSection />
      <ProofBar />
      <CostOfProblem />
      <TwoMoments />
      <HowItWorks />
      <CoreFeatures />
      <SampleOutcomes />
      <DifferentiationSection />
      <LawyerReadySection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
