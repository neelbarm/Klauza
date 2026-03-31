import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function CookiesNavbar() {
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

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="cookies-page">
      <CookiesNavbar />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-display tracking-widest text-primary uppercase mb-3">Legal</p>
          <h1 className="font-display text-3xl sm:text-4xl uppercase leading-tight mb-2">
            COOKIE <span className="text-primary">POLICY</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-10">Effective Date: March 1, 2026</p>

          <div className="prose-sm space-y-8">
            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">1. What Are Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device when you visit a website. They help websites function properly, remember your preferences, and provide information to the site owners. Klauza uses cookies to ensure the Service works securely and reliably.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">2. Essential Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                These cookies are strictly necessary for the Service to function. They cannot be disabled.
              </p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider">Cookie</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider">Purpose</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-xs">connect.sid</td>
                      <td className="px-4 py-2 text-xs">Session authentication — keeps you logged in</td>
                      <td className="px-4 py-2 text-xs">Session</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-xs">csrf_token</td>
                      <td className="px-4 py-2 text-xs">Prevents cross-site request forgery attacks</td>
                      <td className="px-4 py-2 text-xs">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">3. Analytics Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                We may use analytics cookies to understand how visitors interact with the Service. This helps us improve features and fix issues. Analytics data is aggregated and anonymized.
              </p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider">Cookie</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider">Purpose</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-xs">_klz_id</td>
                      <td className="px-4 py-2 text-xs">Anonymous usage tracking — page views and feature usage</td>
                      <td className="px-4 py-2 text-xs">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">4. How to Manage Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Most web browsers allow you to control cookies through their settings. You can typically find cookie controls in your browser's "Settings," "Preferences," or "Privacy" menu. You can:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed mt-3">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> View and delete existing cookies</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> Block all cookies or only third-party cookies</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> Set your browser to notify you when a cookie is set</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Please note that blocking essential cookies will prevent you from logging in and using the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">5. Changes to This Policy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated effective date. If you have questions, contact us at <a href="mailto:privacy@klauza.com" className="text-primary hover:underline">privacy@klauza.com</a>.
              </p>
            </section>
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
          <p className="text-xs text-muted-foreground">&copy; 2026 Klauza. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
