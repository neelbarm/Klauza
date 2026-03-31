import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function PrivacyNavbar() {
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="privacy-page">
      <PrivacyNavbar />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-display tracking-widest text-primary uppercase mb-3">Legal</p>
          <h1 className="font-display text-3xl sm:text-4xl uppercase leading-tight mb-2">
            PRIVACY <span className="text-primary">POLICY</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-10">Effective Date: March 1, 2026</p>

          <div className="prose-sm space-y-8">
            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">1. Introduction</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Klauza ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at klauza.com and any related services (collectively, the "Service"). By using Klauza, you agree to the terms of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Account Information</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    When you create an account, we collect your name, email address, password (stored securely as a hash), business name, and plan selection.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Contract Data</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    When you use our Contract Scanner, we process the text of contracts you upload or paste. This data is used solely to perform the analysis and generate your scan results. We do not share contract text with third parties.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Invoice Data</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Invoice information you create or import, including amounts, due dates, line items, and payment status, is stored to provide our invoicing and payment tracking features.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Client Data</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Information about your clients that you enter into the platform, including names, email addresses, companies, and risk scores calculated by our system.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Usage Data</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We automatically collect information about how you interact with the Service, including pages visited, features used, timestamps, browser type, and device information.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> To provide, operate, and maintain the Service</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> To analyze contracts, generate demand letters, and calculate risk scores</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> To improve and personalize your experience on the platform</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> To communicate with you about your account, updates, and support requests</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> To enforce our Terms of Service and protect against misuse</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> To comply with legal obligations</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-4 font-medium">
                We do not sell your personal data to third parties. Ever.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">4. Data Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed mt-3">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> Encrypted data storage at rest</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> Secure session management with HTTP-only cookies</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> Password hashing using scrypt with unique salts</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> HTTPS encryption for all data in transit</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                While no method of electronic storage is 100% secure, we continuously review and update our security practices to protect your information.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">5. Your Rights</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                You have the following rights regarding your data:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> <strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> <strong>Correction:</strong> Request correction of inaccurate data</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> <strong>Deletion:</strong> Request deletion of your account and all associated data</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> <strong>Export:</strong> Request a portable copy of your data in a standard format</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">—</span> <strong>Opt-Out:</strong> Opt out of non-essential communications at any time</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                To exercise any of these rights, contact us at <a href="mailto:privacy@klauza.com" className="text-primary hover:underline">privacy@klauza.com</a>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">6. Third-Party Services</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may use third-party services for analytics and AI-powered features (such as contract analysis). These services process data in accordance with their own privacy policies. We only share the minimum data necessary to provide the Service and do not allow third parties to use your data for their own purposes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">7. Data Retention</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We retain your data for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">8. Changes to This Policy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Effective Date" above. Your continued use of the Service after changes are posted constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">9. Contact Us</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, contact us at:
              </p>
              <div className="mt-3 p-4 rounded-lg bg-card border border-border">
                <p className="text-sm font-medium">Klauza — Privacy Team</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Email: <a href="mailto:privacy@klauza.com" className="text-primary hover:underline">privacy@klauza.com</a>
                </p>
              </div>
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
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
