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
  Quote,
  Eye,
  FileCheck,
  Scale,
  UserCheck,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════
function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">K</span>
          </div>
          <span className="font-display text-sm tracking-[0.3em] text-foreground">K L A U Z A</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => document.getElementById('protection')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Protection
          </button>
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Log In
          </Link>
          <Link href="/auth">
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm px-5 h-9">
              Get Protected
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════
// 1. HERO — Protection-first positioning
// ═══════════════════════════════════════════════════════════
function HeroSection() {
  return (
    <section className="pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-display tracking-[0.3em] text-primary uppercase mb-6">
          Protection for experienced freelancers
        </p>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase leading-[1.08] tracking-tight">
          Protect your freelance work{" "}
          <span className="text-primary">before clients cost you money.</span>
        </h1>

        <p className="mt-6 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Klauza helps you spot risky contract terms, strengthen payment protection, and chase overdue invoices — without handling the hard part alone.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-sm font-medium">
              Scan a Contract
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-full px-8 h-12 text-sm border-border"
            onClick={() => document.getElementById('chase')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See Payment Chase Workflow
          </Button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. PROOF BAR — 3 benefit statements
// ═══════════════════════════════════════════════════════════
function ProofBar() {
  const items = [
    { icon: Eye, text: "Catch risky clauses before you sign" },
    { icon: Shield, text: "Build stronger payment protection" },
    { icon: Zap, text: "Handle overdue invoices with confidence" },
  ];

  return (
    <section className="py-10 border-y border-border bg-card">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 px-6">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-2.5">
            <item.icon className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground font-medium">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. HOW IT WORKS — 3-step protection flow
// ═══════════════════════════════════════════════════════════
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Upload your contract",
      desc: "Drop in any agreement you've been sent. Klauza scans it across 17 risk categories and flags what needs fixing.",
      icon: Search,
    },
    {
      num: "02",
      title: "Strengthen the terms",
      desc: "Get specific clause suggestions for kill fees, payment terms, IP protection, and scope boundaries. Copy, paste, send.",
      icon: FileCheck,
    },
    {
      num: "03",
      title: "Stay ready if they stall",
      desc: "If a client goes dark or disputes payment, run a structured chase — from reminder to demand letter to court preparation.",
      icon: Zap,
    },
  ];

  return (
    <section className="py-20 px-6" id="how-it-works">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">How It Works</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-4 leading-tight">
          Before you sign.{" "}
          <span className="text-primary">After they stall.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl">
          Klauza covers the two moments that actually cost freelancers money: signing weak terms, and chasing clients who won't pay.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="font-display text-xs text-primary/40 tracking-widest">{step.num}</span>
              </div>
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
// 4. CORE OUTCOMES — Features framed as protection outcomes
// ═══════════════════════════════════════════════════════════
function OutcomesSection() {
  const outcomes = [
    {
      icon: Search,
      title: "Contract Risk Scan",
      desc: "Find weak clauses, missing kill fees, bad payment terms, and hidden risks before you sign. Get a safety score across 17 categories with specific fixes you can copy into your agreement.",
    },
    {
      icon: FileText,
      title: "Stronger Freelancer Contracts",
      desc: "Start with terms built to protect you — scope boundaries, payment timing, late fees, IP ownership, and cancellation protection. Generate jurisdiction-aware agreements in minutes.",
    },
    {
      icon: Zap,
      title: "Overdue Invoice Chase",
      desc: "When a client stops paying, run a structured follow-up: professional reminders, formal notices, demand letters citing your contract terms, and small claims preparation if needed.",
    },
    {
      icon: UserCheck,
      title: "Client Record & History",
      desc: "Keep contracts, invoices, and communication history together. Risk-score clients so you know who to trust and have everything ready if a dispute escalates.",
    },
  ];

  return (
    <section className="py-20 px-6" id="protection" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">What You Get</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight text-white mb-4">
          Protection that covers{" "}
          <span className="text-primary">every stage.</span>
        </h2>
        <p className="text-sm text-white/50 mb-12 max-w-xl">
          Before you sign, while you work, and when things go wrong.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {outcomes.map((o) => (
            <div
              key={o.title}
              className="p-6 rounded-lg border border-white/10"
              style={{ backgroundColor: '#1e1d1a' }}
            >
              <o.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-medium text-white text-sm mb-2">{o.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. CHASE DETAIL — Payment enforcement expanded
// ═══════════════════════════════════════════════════════════
function ChaseSection() {
  const stages = [
    { label: "Friendly Reminder", desc: "Professional nudge referencing your agreement and the overdue amount." },
    { label: "Formal Notice", desc: "Firm notice citing contract terms and applicable law for your jurisdiction." },
    { label: "Demand Letter", desc: "Full legal-style demand with late fees, evidence summary, and a deadline." },
    { label: "Court Preparation", desc: "Filing checklist, case summary, and state-specific court information." },
  ];

  return (
    <section className="py-20 px-6 bg-card" id="chase">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">When Clients Stall</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-4 leading-tight">
          A clear path from{" "}
          <span className="text-primary">overdue to resolved.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-12 max-w-xl">
          Most freelancers freeze when a client stops paying. Klauza gives you a structured process — each step more serious than the last — so you never have to figure out what to do next.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage, i) => (
            <div key={stage.label} className="p-5 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-display font-bold text-primary">{i + 1}</span>
                <p className="text-xs text-muted-foreground font-medium">Stage {i + 1}</p>
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{stage.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-lg border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Every letter references your actual contract terms and jurisdiction-specific law.</p>
            <p className="text-xs text-muted-foreground mt-1">Supports US, UK, Canada, Nigeria, EU, Australia, India, and South Africa.</p>
          </div>
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-9 text-sm shrink-0">
              See Chase Workflow
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. DIFFERENTIATION — Why Klauza is not another admin tool
// ═══════════════════════════════════════════════════════════
function DifferentiationSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Why Klauza</p>
          <h2 className="font-display text-2xl sm:text-3xl uppercase leading-tight mb-6">
            More than{" "}
            <span className="text-primary">admin software.</span>
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Most freelancer tools help you send invoices and manage projects. They work fine — until a client sends you a contract with no kill fee, pays 60 days late, or stops responding entirely.
            </p>
            <p>
              Klauza is built for those moments. The ones that actually threaten your revenue.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "Generic tools", desc: "Proposals, invoices, time tracking", muted: true },
            { label: "Klauza", desc: "Risk scanning, payment protection, structured enforcement", muted: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`p-5 rounded-lg border ${item.muted ? "border-border bg-muted/30" : "border-primary/30 bg-primary/5"}`}
            >
              <p className={`text-xs font-display uppercase tracking-wider mb-1.5 ${item.muted ? "text-muted-foreground" : "text-primary"}`}>
                {item.label}
              </p>
              <p className={`text-sm ${item.muted ? "text-muted-foreground" : "text-foreground font-medium"}`}>
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
// 7. IDEAL CUSTOMER — Who this is for
// ═══════════════════════════════════════════════════════════
function IdealCustomerSection() {
  const bullets = [
    "You work directly with clients, not just through marketplaces",
    "You've dealt with vague scopes, delayed payment, or weak contract terms",
    "You want stronger protection without hiring a lawyer for every job",
    "You charge enough that one bad client can cost you thousands",
  ];

  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Who It's For</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase text-white mb-6 leading-tight">
          Built for freelancers{" "}
          <span className="text-primary">with real client risk.</span>
        </h2>
        <p className="text-sm text-white/50 mb-10 max-w-xl mx-auto">
          If you've ever lost money to a bad contract or spent weeks chasing an invoice, you already know why this exists.
        </p>
        <div className="max-w-md mx-auto space-y-3 text-left">
          {bullets.map((b) => (
            <div key={b} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-white/70">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 8. TESTIMONIALS
// ═══════════════════════════════════════════════════════════
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Klauza caught a missing kill fee clause that would have cost me $12,000. Paid for itself in one scan.",
      author: "Sarah K.",
      role: "Brand Strategist",
    },
    {
      quote: "A client ghosted on a $5,000 invoice. The demand letter got them to pay within a week.",
      author: "Marcus T.",
      role: "UX Designer",
    },
    {
      quote: "I used to just accept bad payment terms because I didn't know what to push back on. Now I do.",
      author: "Priya S.",
      role: "Web Developer",
    },
  ];

  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4 text-center">From Freelancers</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-12 text-center">
          Real protection.{" "}
          <span className="text-primary">Real results.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.author} className="p-5 bg-background border-border">
              <Quote className="h-4 w-4 text-primary/40 mb-3" />
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t.quote}</p>
              <div>
                <p className="text-sm font-medium">{t.author}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// 9. PRICING — Framed as protection ROI
// ═══════════════════════════════════════════════════════════
function PricingSection() {
  const proFeatures = [
    "Unlimited contract scanning",
    "Contract risk reports across 17 categories",
    "Jurisdiction-aware contract templates",
    "Invoice tracking with overdue detection",
    "4-stage payment chase workflow",
    "Demand letter generation",
    "Client risk scoring",
    "Evidence organizer for disputes",
  ];
  const enterpriseFeatures = [
    "Everything in Pro",
    "Team collaboration",
    "API access",
    "Custom branding",
    "Priority support",
    "Dedicated account manager",
    "Bulk contract scanning",
    "Advanced reporting",
  ];

  return (
    <section className="py-20 px-6" id="pricing">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4 text-center">Pricing</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-3 text-center leading-tight">
          One missed payment costs more{" "}
          <span className="text-primary">than a year of Klauza.</span>
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          For $80/month, you catch contract risk earlier, strengthen payment terms, and act faster when clients stop paying.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pro */}
          <Card className="p-6 border-2 border-primary" style={{ backgroundColor: '#141412' }}>
            <div className="mb-6">
              <span className="text-xs font-display tracking-widest text-primary uppercase">Pro</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-white">$80</span>
                <span className="text-sm text-white/50">/mo</span>
              </div>
              <p className="text-xs text-white/40 mt-1">For freelancers and consultants</p>
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
          <Card className="p-6 bg-card border-border">
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
          Protect the next contract{" "}
          <span className="text-primary">before it becomes a problem.</span>
        </h2>
        <p className="text-sm text-white/40 mt-4 max-w-xl mx-auto">
          Scan your agreement, strengthen the terms, and stay ready if a client stops paying.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-sm font-medium">
              Scan a Contract
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-full px-8 h-12 text-sm border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => document.getElementById('chase')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View Payment Chase Workflow
          </Button>
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
          <p className="text-xs text-muted-foreground">Protect your work.<br />Get paid with confidence.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Protection</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Contract Scanner</Link></li>
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Contract Templates</Link></li>
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Invoice Chase</Link></li>
            <li><Link href="/auth" className="hover:text-foreground transition-colors">Client Records</Link></li>
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
      <HowItWorks />
      <OutcomesSection />
      <ChaseSection />
      <DifferentiationSection />
      <IdealCustomerSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
