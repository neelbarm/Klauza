import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function AboutNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">K</span>
            </div>
            <span className="font-display text-sm tracking-[0.3em] text-foreground">K L A U Z A</span>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm text-foreground font-medium">About</Link>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
        </div>
        <Link href="/auth">
          <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm px-5 h-9">
            Start Free
          </Button>
        </Link>
      </div>
    </nav>
  );
}

const VALUES = [
  {
    title: "FREELANCERS FIRST",
    desc: "Every feature we build starts with a real freelancer problem. Not investor metrics, not growth hacks — actual pain points from people doing independent work.",
  },
  {
    title: "RADICAL CLARITY",
    desc: "We strip away the complexity. Klauza tells you what's wrong with your contract, who's at risk, and what to do next — in plain language, not legalese.",
  },
  {
    title: "ENFORCED FAIRNESS",
    desc: "Getting paid for your work shouldn't require legal training or confrontation. We automate the uncomfortable parts so you can focus on the work.",
  },
];

const STATS = [
  { value: "30M+", label: "freelancers in the US" },
  { value: "$150B", label: "lost to payment disputes yearly" },
  { value: "37s", label: "average contract scan time" },
  { value: "4x", label: "recovery rate vs. manual pursuit" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="about-page">
      <AboutNavbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Our Story</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase leading-[1.05] tracking-tight">
            BUILT BY FREELANCERS,{" "}
            <span className="text-primary">FOR FREELANCERS.</span>
          </h1>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 px-6" style={{ backgroundColor: "#141412" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-2xl uppercase text-white mb-6 leading-tight">
              WE LIVED THE{" "}
              <span className="text-primary">PROBLEM.</span>
            </h2>
            <div className="space-y-4 text-sm text-white/60 leading-relaxed">
              <p>
                In 2024, our founding team — freelance designers, developers, and consultants — lost a combined $43,000 to a single client who disputed work after delivery. The contract had gaps. The invoices had no clear late fees. The chain of communication was scattered across three apps.
              </p>
              <p>
                We spent months cobbling together a solution from Google Docs, Notion, QuickBooks, and a lawyer on retainer. It worked — barely. And it cost us more time than the original project.
              </p>
              <p>
                Klauza is what we wish had existed. One platform that catches the problems before they happen, and handles the consequences when they do.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-lg border border-white/10 bg-white/5">
              <p className="font-display text-sm uppercase text-white/40 tracking-wider mb-1">Before Klauza</p>
              <p className="text-white text-sm leading-relaxed">5 tools, 20+ hours/month on admin, $43K lost in a single dispute.</p>
            </div>
            <div className="p-5 rounded-lg border border-primary/30 bg-primary/5">
              <p className="font-display text-sm uppercase text-primary tracking-wider mb-1">After Klauza</p>
              <p className="text-white/80 text-sm leading-relaxed">One platform, 2 hours/month on admin, $0 lost in the following year.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="py-12 border-y border-border bg-card">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl sm:text-3xl text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Our Values</p>
          <h2 className="font-display text-2xl sm:text-3xl uppercase mb-12">WHAT WE STAND FOR</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <Card key={v.title} className="p-6 bg-card border-border">
                <h3 className="font-display text-sm uppercase tracking-wider mb-3 text-primary">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6" style={{ backgroundColor: "#141412" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl sm:text-3xl uppercase text-white mb-4 leading-tight">
            JOIN THE FREELANCERS{" "}
            <span className="text-primary">WHO GET PAID.</span>
          </h2>
          <p className="text-sm text-white/40 mb-8 max-w-xl mx-auto">
            Start with a free trial. No credit card required.
          </p>
          <Link href="/auth">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-11 text-sm">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">K</span>
            </div>
            <span className="font-display text-xs tracking-[0.2em]">KLAUZA</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Klauza. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
