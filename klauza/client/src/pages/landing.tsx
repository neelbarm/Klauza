import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  FileText,
  Users,
  Receipt,
  AlertTriangle,
  Shield,
  BarChart3,
  Clock,
  Zap,
  ChevronRight,
  Quote,
} from "lucide-react";

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
            onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="nav-platform"
          >
            Platform
          </button>
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="nav-pricing"
          >
            Pricing
          </button>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-blog">
            Blog
          </Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-about">
            About
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-login">
            Log In
          </Link>
          <Link href="/auth">
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm px-5 h-9" data-testid="button-signup">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        {/* Main headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase leading-[1.1] tracking-tight">
          SCAN. PROTECT.{" "}
          <span className="text-primary">GET PAID.</span>
        </h1>

        {/* Flow diagram pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          {["Contract", "Client", "Invoice", "Trigger"].map((item, i) => (
            <div key={item} className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-full border border-border text-sm font-medium bg-card">
                {item}
              </span>
              {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Bottom pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["Risk Report", "Kill Fee", "Payment", "Dashboard", "Audit"].map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Sub copy */}
        <p className="mt-10 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Klauza replaces the five tools you're juggling — contracts, invoicing, client CRM, risk scoring, and enforcement — into one platform built for freelancers who refuse to get stiffed.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-11 text-sm" data-testid="button-start-pro-hero">
              Start Pro — $80/mo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-full px-8 h-11 text-sm border-border"
            onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })}
            data-testid="button-see-platform"
          >
            See the Platform
          </Button>
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  const stats = [
    { value: "30M", label: "freelancers in the US" },
    { value: "27%", label: "lost income to late/non-payment" },
    { value: "1 hr", label: "wasted daily on admin" },
    { value: "37 sec", label: "average contract scan time" },
  ];
  return (
    <section className="py-12 border-y border-border bg-card">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-2xl sm:text-3xl text-foreground">{stat.value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="py-20 px-6" id="problem">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        <div>
          <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">The Problem</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase leading-tight">
            YOU ARE THE SYSTEM.{" "}
            <span className="text-primary">THAT IS THE PROBLEM.</span>
          </h2>
        </div>
        <div>
          <blockquote className="border-l-2 border-primary pl-4 text-muted-foreground italic mb-6">
            "I spend more time chasing payments than doing actual work. By the time I realize a client is ghosting me, it's too late."
          </blockquote>
          <ul className="space-y-3 text-sm text-foreground/80">
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Contracts live in Google Docs. Invoices in QuickBooks. Clients in spreadsheets.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              No early-warning system when a client starts going dark.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Enforcement feels impossible — you're not a lawyer.
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Every hour chasing money is an hour you can't bill.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const features = [
    {
      icon: FileText,
      title: "Contract Scanner",
      desc: "AI-powered contract analysis scores your agreements for strength, identifies missing clauses, and suggests kill fees.",
    },
    {
      icon: Users,
      title: "Client CRM",
      desc: "Track client risk scores, payment history, and communication in one place. Know who's reliable and who's not.",
    },
    {
      icon: Receipt,
      title: "Invoice Engine",
      desc: "Create, send, and track invoices. Automatic overdue detection and escalation triggers.",
    },
    {
      icon: Shield,
      title: "Chase Engine",
      desc: "4-stage enforcement: friendly reminder → formal notice → demand letter → small claims prep. Automated escalation.",
    },
    {
      icon: BarChart3,
      title: "Risk Dashboard",
      desc: "Real-time analytics on revenue, at-risk clients, contract strength, and recovery rates.",
    },
  ];

  return (
    <section className="py-20 px-6" id="solution" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">The Solution</p>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase leading-tight text-white mb-12">
          ONE PLATFORM.{" "}
          <span className="text-primary">ZERO FRAGMENTATION.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {features.slice(0, 3).map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-lg border border-white/10"
              style={{ backgroundColor: '#1e1d1a' }}
            >
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-medium text-white text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {features.slice(3).map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-lg border border-white/10"
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

function HowItWorks() {
  const steps = [
    { num: "01", title: "Upload or Create", desc: "Drop in your existing contract or build one from our templates. AI scores it instantly." },
    { num: "02", title: "Onboard Your Client", desc: "Add client details, link them to contracts, and start tracking risk signals." },
    { num: "03", title: "Invoice & Monitor", desc: "Send professional invoices, track payments, and get alerts when things go sideways." },
    { num: "04", title: "Enforce & Recover", desc: "When a client ghosts, Klauza escalates automatically — from nudge to demand letter to small claims." },
  ];

  return (
    <section className="py-20 px-6" id="how-it-works">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">How It Works</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-12">FOUR STEPS TO GETTING PAID</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num}>
              <span className="font-display text-3xl text-primary/30">{step.num}</span>
              <h3 className="font-semibold text-sm mt-2 mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const proFeatures = [
    "Unlimited contracts", "AI contract scanning", "Client risk scoring", "Invoice tracking",
    "4-stage enforcement", "Demand letter generation", "Dashboard analytics", "Email support",
  ];
  const enterpriseFeatures = [
    "Everything in Pro", "Team collaboration", "API access", "Custom branding",
    "Priority support", "Dedicated account manager", "Bulk contract upload", "Advanced analytics",
  ];

  return (
    <section className="py-20 px-6" id="pricing">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4 text-center">Pricing</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-12 text-center">SIMPLE, TRANSPARENT PRICING</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pro */}
          <Card className="p-6 border-2 border-primary" style={{ backgroundColor: '#141412' }}>
            <div className="mb-6">
              <span className="text-xs font-display tracking-widest text-primary uppercase">Pro</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-white">$80</span>
                <span className="text-sm text-white/50">/mo</span>
              </div>
              <p className="text-xs text-white/40 mt-1">For independent freelancers</p>
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
              <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-pricing-pro">
                Start Pro
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
              <p className="text-xs text-muted-foreground mt-1">For agencies & teams</p>
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
              <Button variant="outline" className="w-full rounded-full" data-testid="button-pricing-enterprise">
                Contact Sales
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Klauza caught a missing kill fee clause that would have cost me $12,000. The contract scanner paid for itself in one scan.",
      author: "Sarah K.",
      role: "Brand Strategist",
    },
    {
      quote: "I went from spending 5 hours a week on invoicing and follow-ups to about 20 minutes. The chase engine is incredibly effective.",
      author: "Marcus T.",
      role: "UX Designer",
    },
    {
      quote: "The demand letter feature alone recovered $8,500 from a client who had been ignoring me for 3 months.",
      author: "Priya S.",
      role: "Web Developer",
    },
  ];

  return (
    <section className="py-20 px-6 bg-card">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-display tracking-widest text-primary uppercase mb-4 text-center">Testimonials</p>
        <h2 className="font-display text-2xl sm:text-3xl uppercase mb-12 text-center">TRUSTED BY FREELANCERS</h2>
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

function FinalCTA() {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#141412' }}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl uppercase text-white leading-tight">
          STOP LOSING HOURS TO{" "}
          <span className="text-primary">FRAGMENTED TOOLS.</span>
        </h2>
        <p className="text-sm text-white/40 mt-4 max-w-xl mx-auto">
          Join thousands of freelancers who protect their income, enforce their contracts, and get paid on time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-11 text-sm" data-testid="button-final-cta">
              Start Pro — $80/mo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

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
          <p className="text-xs text-muted-foreground">Protect your income.<br />Enforce your contracts.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Product</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>Contract Scanner</li>
            <li>Client CRM</li>
            <li>Invoice Engine</li>
            <li>Chase Engine</li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Company</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            <li>Careers</li>
            <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3">Legal</p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Cookie Policy</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">© 2026 Klauza. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      <Navbar />
      <HeroSection />
      <StatsBand />
      <ProblemSection />
      <SolutionSection />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
