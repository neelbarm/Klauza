import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, MessageSquare, Clock, Check } from "lucide-react";

function ContactNavbar() {
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
          <Link href="/contact" className="text-sm text-foreground font-medium">Contact</Link>
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

const SUBJECT_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing & Plans" },
  { value: "enterprise", label: "Enterprise Sales" },
  { value: "partnership", label: "Partnership" },
  { value: "feedback", label: "Product Feedback" },
];

export default function ContactPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side success state (no backend needed yet)
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="contact-page">
      <ContactNavbar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="text-xs font-display tracking-widest text-primary uppercase mb-3">Contact</p>
            <h1 className="font-display text-3xl sm:text-4xl uppercase leading-tight">
              GET IN{" "}
              <span className="text-primary">TOUCH</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              Have a question about Klauza, need support, or want to explore enterprise options? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-10">
            {/* Left: Contact info */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Email Us</p>
                  <p className="text-sm text-muted-foreground">hello@klauza.com</p>
                  <p className="text-xs text-muted-foreground mt-0.5">We respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Available in-app for Pro users</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Mon–Fri, 9am–6pm EST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">Response Time</p>
                  <p className="text-sm text-muted-foreground">Free: 2–3 business days</p>
                  <p className="text-sm text-muted-foreground">Pro: 24 hours</p>
                  <p className="text-sm text-muted-foreground">Enterprise: Same day</p>
                </div>
              </div>

              <Card className="p-5 bg-card border-border mt-8">
                <p className="font-display text-xs uppercase tracking-wider mb-2 text-primary">Enterprise Inquiries</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Looking for team access, custom onboarding, or API integration? Select "Enterprise Sales" below and our team will be in touch within 4 hours.
                </p>
              </Card>
            </div>

            {/* Right: Form */}
            <div className="md:col-span-3">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Check className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Message sent!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Thanks for reaching out. We'll get back to you at <strong>{email}</strong> as soon as possible.
                  </p>
                  <button
                    className="mt-6 text-sm text-primary hover:underline"
                    onClick={() => {
                      setSubmitted(false);
                      setFirstName(""); setLastName(""); setEmail(""); setSubject(""); setMessage("");
                    }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <Card className="p-6 bg-card border-border">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Jane"
                          required
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Smith"
                          required
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        required
                        data-testid="input-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm">Subject</Label>
                      <Select value={subject} onValueChange={setSubject} required>
                        <SelectTrigger data-testid="select-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm">Message</Label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us how we can help..."
                        required
                        rows={5}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                        data-testid="input-message"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-contact-submit"
                    >
                      Send Message
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

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
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
