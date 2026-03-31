import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Mail } from "lucide-react";

function CareersNavbar() {
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
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
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

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="careers-page">
      <CareersNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-display tracking-widest text-primary uppercase mb-4">Careers</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase leading-[1.05] tracking-tight">
            BUILDING THE FUTURE OF{" "}
            <span className="text-primary">FREELANCE PROTECTION.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Klauza exists because 30 million freelancers in the US deserve better tools to protect their income, enforce their contracts, and get paid on time. We're a small, focused team and every person here makes a real impact.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6" style={{ backgroundColor: "#141412" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-xl uppercase text-white mb-8">WHAT IT'S LIKE <span className="text-primary">HERE</span></h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-lg border border-white/10 bg-white/5">
              <p className="font-display text-xs uppercase text-primary tracking-wider mb-2">Remote-First</p>
              <p className="text-sm text-white/60 leading-relaxed">Work from anywhere. We care about results, not hours in a seat. Our team spans multiple time zones and we make it work with async communication.</p>
            </div>
            <div className="p-5 rounded-lg border border-white/10 bg-white/5">
              <p className="font-display text-xs uppercase text-primary tracking-wider mb-2">Ship Fast</p>
              <p className="text-sm text-white/60 leading-relaxed">We move quickly and iterate based on real user feedback. You'll see your work in production fast — and hear directly from the freelancers it helps.</p>
            </div>
            <div className="p-5 rounded-lg border border-white/10 bg-white/5">
              <p className="font-display text-xs uppercase text-primary tracking-wider mb-2">Ownership</p>
              <p className="text-sm text-white/60 leading-relaxed">No micromanagement. You own your domain end-to-end. We trust you to make good decisions and give you the context to make them well.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-xl uppercase mb-4">OPEN <span className="text-primary">POSITIONS</span></h2>
          <Card className="p-8 bg-card border-border">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">No open positions right now</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                We're always looking for talented people who are passionate about helping freelancers. If you think you'd be a great fit, we'd love to hear from you.
              </p>
              <a href="mailto:careers@klauza.com">
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-10 text-sm mt-2">
                  Send us your info
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <p className="text-xs text-muted-foreground">
                Email <a href="mailto:careers@klauza.com" className="text-primary hover:underline">careers@klauza.com</a> with your background and what excites you about Klauza.
              </p>
            </div>
          </Card>
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
          <p className="text-xs text-muted-foreground">&copy; 2026 Klauza. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
