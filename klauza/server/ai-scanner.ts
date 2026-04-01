const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Call Claude API (Haiku 4.5) with retry logic
async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return generateDemoAnalysis(userMessage);
  }

  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);

      const response = await fetch(CLAUDE_URL, {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8000,
          system: systemPrompt,
          messages: [
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (response.status === 429 || response.status >= 500) {
        lastError = `HTTP ${response.status}`;
        console.error(`Claude API attempt ${attempt + 1} failed: ${lastError}`);
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error("Claude API error:", err);
        return generateDemoAnalysis(userMessage);
      }

      const data = await response.json() as any;
      return data.content?.[0]?.text || "Analysis could not be completed.";
    } catch (err: any) {
      lastError = err.message || "Network error";
      console.error(`Claude API attempt ${attempt + 1} error:`, lastError);
    }
  }

  console.error(`Claude API failed after ${MAX_RETRIES + 1} attempts, falling back to demo analysis`);
  return generateDemoAnalysis(userMessage);
}

// Contract scanning prompt
const CONTRACT_SCAN_SYSTEM = `You are Klauza, an expert freelance contract analyzer. You protect freelancers from risky contract terms.

When given contract text, analyze it and return a JSON object with this EXACT structure (no markdown, just raw JSON):
{
  "overallScore": <number 0-100, where 100 is perfectly safe>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "summary": "<2-3 sentence summary of the contract's quality for the freelancer>",
  "risks": [
    {
      "category": "<category name>",
      "severity": "<LOW|MEDIUM|HIGH|CRITICAL>",
      "clause": "<exact problematic text from the contract or description>",
      "explanation": "<why this is risky for the freelancer>",
      "recommendation": "<what to change or add>"
    }
  ],
  "missingProtections": [
    {
      "protection": "<name of missing protection>",
      "importance": "<HIGH|MEDIUM|LOW>",
      "description": "<why this should be in the contract>"
    }
  ],
  "strengths": ["<list of good clauses already in the contract>"],
  "suggestedClauses": [
    {
      "name": "<clause name>",
      "text": "<exact legal clause text to add>",
      "reason": "<why to add this>"
    }
  ]
}

Analyze across these 17 categories: Payment Terms, Kill Fee/Cancellation, IP Ownership, Scope Definition, Revision Limits, Late Payment Penalties, Termination Clause, Non-Compete, Confidentiality, Liability Cap, Indemnification, Dispute Resolution, Work-for-Hire, Deliverable Specifications, Timeline/Deadlines, Subcontracting Rights, Force Majeure.

Be specific. Quote actual clauses. Give actionable recommendations. Always suggest adding a kill fee if one is missing.

KEEP IT CONCISE:
- Each explanation and recommendation should be 1-2 sentences max
- Suggested clause text should be 2-3 sentences max, not full legal paragraphs
- Focus on the top 5-8 most important risks, not every possible issue

IMPORTANT: Return ONLY the raw JSON object. Do NOT wrap it in markdown code fences or backticks. Start your response with { and end with }.`;

export async function scanContract(contractText: string): Promise<any> {
  const trimmed = contractText.substring(0, 15000);
  const result = await callClaude(CONTRACT_SCAN_SYSTEM, `Analyze this freelance contract:\n\n${trimmed}`);

  // Try multiple JSON extraction strategies
  try {
    // Strategy 1: direct parse
    return JSON.parse(result);
  } catch (_) {}

  try {
    // Strategy 2: extract JSON from markdown code fence (greedy match for nested objects)
    const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      const inner = fenceMatch[1].trim();
      const firstBrace = inner.indexOf("{");
      const lastBrace = inner.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(inner.substring(firstBrace, lastBrace + 1));
      }
    }
  } catch (_) {}

  try {
    // Strategy 3: find outermost { ... } anywhere in the response
    const firstBrace = result.indexOf("{");
    const lastBrace = result.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(result.substring(firstBrace, lastBrace + 1));
    }
  } catch (_) {}

  // Strategy 4: truncated JSON repair — close any open brackets/braces
  try {
    const firstBrace = result.indexOf("{");
    if (firstBrace !== -1) {
      let candidate = result.substring(firstBrace);
      // Remove trailing code fence if present
      candidate = candidate.replace(/```\s*$/, "").trim();
      // Count unclosed brackets and braces, then close them
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escaped = false;
      for (const ch of candidate) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
      // Close any unclosed structures
      for (let i = 0; i < openBrackets; i++) candidate += "]";
      for (let i = 0; i < openBraces; i++) candidate += "}";
      const parsed = JSON.parse(candidate);
      if (parsed.overallScore !== undefined) {
        console.log("JSON repair succeeded (closed", openBraces, "braces,", openBrackets, "brackets)");
        return parsed;
      }
    }
  } catch (_) {}

  console.error("All JSON parse strategies failed. Response length:", result.length, "starts with:", result.substring(0, 100));
  return {
    overallScore: 50,
    riskLevel: "MEDIUM",
    summary: "Analysis completed. See detailed findings below.",
    rawAnalysis: result,
    risks: [],
    missingProtections: [],
    strengths: [],
    suggestedClauses: [],
  };
}

// Generate a protective contract based on scan results
const CONTRACT_GENERATE_SYSTEM = `You are Klauza, an expert freelance contract writer. Generate ironclad freelance contracts that protect the freelancer.

When given context about a project, generate a complete, professional freelance service agreement. Include ALL of these sections:
1. Parties & Effective Date
2. Scope of Work (detailed)
3. Timeline & Milestones
4. Payment Terms (Net-30 default, with late fee of 1.5% per month)
5. Kill Fee / Cancellation Policy (25% if canceled within 2 weeks, 50% within 1 week, 100% after work begins)
6. IP Ownership (all IP transfers ONLY upon full payment)
7. Revision Policy (max 2 rounds included, additional at hourly rate)
8. Confidentiality (mutual NDA)
9. Liability Cap (limited to contract value)
10. Termination Clause (14-day written notice, pro-rated payment for work done)
11. Dispute Resolution (mediation first, then binding arbitration)
12. Force Majeure
13. Non-Solicitation (12 months)
14. Governing Law
15. Signature Block

Use plain, enforceable language. Make it strongly protective of the freelancer while being fair to the client.`;

export async function generateProtectiveContract(context: string): Promise<string> {
  return callClaude(CONTRACT_GENERATE_SYSTEM, context);
}

// ============================================================================
// AI-POWERED DEMAND LETTERS & ESCALATION
// ============================================================================

export interface DemandLetterContext {
  stage: number; // 1-4
  amount: number; // in cents
  clientName: string;
  clientBusinessName?: string;
  clientEmail?: string;
  clientAddress?: string;
  freelancerName: string;
  description: string;
  originalDueDate?: string;
  jurisdiction: string;
  jurisdictionInfo?: {
    name: string;
    demandLetterLaw: string;
    courtSystem: string;
    interestRate: string;
    currencySymbol: string;
    currencyCode: string;
    latePaymentRef: string;
    filingProcess: string;
  };
  contractText?: string;
  evidenceList: string[];
  daysSinceCreation: number;
}

const STAGE_PROMPTS: Record<number, string> = {
  1: `You are writing a professional but friendly payment reminder email on behalf of a freelancer. Be warm but clear about the amount owed and deadline. Reference the specific work done and original agreement if contract text is provided. Keep it under 200 words. Include a 7-day deadline. Do NOT use legal threats at this stage.

Return ONLY the email text. Start with "Subject: ..." on the first line, then a blank line, then the email body. Do not include any explanation or preamble outside the email.`,

  2: `You are writing a formal payment notice on behalf of a freelancer. This is the second attempt to collect payment. Be firm and professional. Reference the specific contract terms if provided. Cite the applicable law for the jurisdiction. Include a 14-day deadline. Mention that failure to pay will result in escalation to a formal demand letter. Include the exact amount with any applicable late fees.

Return ONLY the email text. Start with "Subject: ..." on the first line, then a blank line, then the email body.`,

  3: `You are writing a formal legal demand letter on behalf of a freelancer. This is a serious document that may be used in court proceedings. Reference specific contract clauses if contract text is provided. Cite applicable laws for the jurisdiction. Calculate and include late fees. List all evidence on file. State that failure to pay within 10 business days will result in court filing. Use formal legal language but keep it readable. Include the freelancer's name, the client/defendant's full details, and all relevant dates. This should read like a letter from a collections department.

Return ONLY the demand letter text. Start with "FORMAL DEMAND LETTER" as the header. Include all formal elements (date, addresses, RE line, etc).`,

  4: `You are preparing a small claims court case summary for a freelancer. Create a structured document that includes:
1) Case Summary (2-3 paragraphs explaining what happened)
2) Damages Calculation (itemized: original amount, late fees, filing costs)
3) Evidence Summary (list all evidence with descriptions)
4) Key Contract Terms (if contract provided, list the specific breached terms)
5) Legal Basis (cite applicable laws for the jurisdiction)
6) Relief Sought (what the freelancer is asking the court to award)

Format it clearly with section headers. Return ONLY the case summary document.`,
};

export async function generateAIDemandLetter(context: DemandLetterContext): Promise<string> {
  const systemPrompt = STAGE_PROMPTS[context.stage];
  if (!systemPrompt) {
    return `[Invalid stage ${context.stage}]`;
  }

  const currSymbol = context.jurisdictionInfo?.currencySymbol || "$";
  const amountStr = `${currSymbol}${(context.amount / 100).toFixed(2)}`;
  const jurName = context.jurisdictionInfo?.name || context.jurisdiction;
  const lawRef = context.jurisdictionInfo?.demandLetterLaw || "applicable contract law";
  const courtRef = context.jurisdictionInfo?.courtSystem || "the appropriate court";
  const interestRate = context.jurisdictionInfo?.interestRate || "1.5% per month";
  const latePayRef = context.jurisdictionInfo?.latePaymentRef || "applicable law";
  const filingInfo = context.jurisdictionInfo?.filingProcess || "";

  const userMessage = `Generate a stage ${context.stage} escalation document with these details:

FREELANCER: ${context.freelancerName}
CLIENT/DEFENDANT: ${context.clientName}${context.clientBusinessName ? ` (d/b/a ${context.clientBusinessName})` : ""}
CLIENT EMAIL: ${context.clientEmail || "[NOT PROVIDED]"}
CLIENT ADDRESS: ${context.clientAddress || "[NOT PROVIDED]"}

AMOUNT OWED: ${amountStr} (${context.jurisdictionInfo?.currencyCode || "USD"})
ORIGINAL DUE DATE: ${context.originalDueDate || "[NOT SPECIFIED]"}
DAYS OVERDUE: ${context.daysSinceCreation}

JURISDICTION: ${jurName}
APPLICABLE LAW: ${lawRef}
COURT SYSTEM: ${courtRef}
STATUTORY INTEREST RATE: ${interestRate}
LATE PAYMENT REFERENCE: ${latePayRef}
${filingInfo ? `FILING PROCESS: ${filingInfo}` : ""}

DESCRIPTION OF WORK/DISPUTE:
${context.description || "Professional services were rendered but payment has not been received."}

${context.contractText ? `CONTRACT TEXT (key excerpts):\n${context.contractText.substring(0, 3000)}\n` : "No contract text available."}

EVIDENCE ON FILE:
${context.evidenceList.length > 0 ? context.evidenceList.map((e, i) => `${i + 1}. ${e}`).join("\n") : "No evidence items recorded yet."}

TODAY'S DATE: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;

  // callClaude falls back to generateDemoAnalysis if no API key is set.
  // Since demo analysis is designed for contract scanning, we catch that case
  // and return empty string so the caller can fall back to templates.
  if (!ANTHROPIC_API_KEY) {
    return ""; // Signal to caller: use template fallback
  }

  try {
    const result = await callClaude(systemPrompt, userMessage);
    // If the result looks like the demo contract scan JSON, it means the API
    // wasn't available and the fallback fired — return empty to trigger template fallback
    if (result.startsWith("{") && result.includes("overallScore")) {
      return "";
    }
    return result;
  } catch {
    return ""; // Fallback to templates
  }
}

// ============================================================================
// AI-POWERED CONTRACT GENERATION FROM SCAN RESULTS
// ============================================================================

const CONTRACT_FROM_SCAN_SYSTEM = `You are Klauza, an expert freelance contract writer. You are generating an ironclad freelance contract that specifically addresses risks found in a previous contract scan.

For each risk identified in the scan results, include a protective clause that directly fixes or counters that risk. Include all standard contract sections:
1. Parties & Effective Date
2. Scope of Work
3. Timeline & Milestones
4. Payment Terms (with late fee clause)
5. Kill Fee / Cancellation Policy
6. IP Ownership (transfers only upon full payment)
7. Revision Policy (limited rounds)
8. Confidentiality (mutual NDA)
9. Liability Cap (limited to contract value)
10. Termination Clause (14-day notice, pro-rated payment)
11. Indemnification (mutual)
12. Dispute Resolution (mediation first, then arbitration)
13. Force Majeure
14. Non-Solicitation
15. Governing Law
16. Signature Block

Make it jurisdiction-aware based on the provided jurisdiction. Use plain, enforceable language. Make it strongly protective of the freelancer while being fair to the client.

IMPORTANT: For each section, if the scan found a specific risk in that area, add a comment noting what risk this clause addresses.`;

export async function generateAIContractFromScan(scanResults: any, projectContext: string): Promise<string> {
  // Build a summary of the scan results for the AI
  const risks = scanResults?.risks || [];
  const missingProtections = scanResults?.missingProtections || [];
  const suggestedClauses = scanResults?.suggestedClauses || [];

  const riskSummary = risks.length > 0
    ? risks.map((r: any, i: number) => `  ${i + 1}. [${r.severity}] ${r.category}: ${r.explanation}`).join("\n")
    : "  No specific risks identified.";

  const missingSummary = missingProtections.length > 0
    ? missingProtections.map((m: any, i: number) => `  ${i + 1}. [${m.importance}] ${m.protection}: ${m.description}`).join("\n")
    : "  No missing protections identified.";

  const clauseSummary = suggestedClauses.length > 0
    ? suggestedClauses.map((c: any, i: number) => `  ${i + 1}. ${c.name}: ${c.reason}`).join("\n")
    : "";

  const userMessage = `${projectContext}

SCAN RESULTS — RISKS FOUND:
${riskSummary}

MISSING PROTECTIONS:
${missingSummary}

${clauseSummary ? `SUGGESTED CLAUSES TO INCORPORATE:\n${clauseSummary}\n` : ""}
OVERALL RISK SCORE: ${scanResults?.overallScore || "N/A"}/100 (${scanResults?.riskLevel || "UNKNOWN"})
SCAN SUMMARY: ${scanResults?.summary || "N/A"}

Generate a complete contract that specifically addresses ALL of the above risks and incorporates ALL suggested protections. Each protective clause should be clearly labeled.`;

  return callClaude(CONTRACT_FROM_SCAN_SYSTEM, userMessage);
}

// Invoice parsing prompt
const INVOICE_PARSE_SYSTEM = `You are an invoice data extraction expert. Given invoice text, extract key information and return a JSON object with this EXACT structure (no markdown, just raw JSON):
{
  "clientName": "<name of the client/company being billed>",
  "clientEmail": "<email if found, or null>",
  "invoiceNumber": "<invoice number if found, or null>",
  "amount": <total amount in cents as integer, e.g. 5000 for $50.00>,
  "currency": "<currency code, default USD>",
  "issueDate": "<date in YYYY-MM-DD format, or null>",
  "dueDate": "<due date in YYYY-MM-DD format, or null>",
  "description": "<brief description of services>",
  "lineItems": [
    {"description": "<item>", "amount": <cents>}
  ],
  "paymentTerms": "<e.g. Net 30, Due on receipt, etc>",
  "status": "<estimate: paid|unpaid|overdue based on dates and any paid stamps>"
}

If a due date isn't explicitly stated, infer from payment terms (e.g., Net 30 = issue date + 30 days). Today's date is ${new Date().toISOString().split('T')[0]}.`;

export async function parseInvoice(invoiceText: string): Promise<any> {
  const trimmed = invoiceText.substring(0, 10000);
  const result = await callClaude(INVOICE_PARSE_SYSTEM, `Extract data from this invoice:\n\n${trimmed}`);

  try {
    return JSON.parse(result);
  } catch (_) {}

  try {
    const fenceMatch = result.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      const inner = fenceMatch[1].trim();
      const fb = inner.indexOf("{");
      const lb = inner.lastIndexOf("}");
      if (fb !== -1 && lb > fb) return JSON.parse(inner.substring(fb, lb + 1));
    }
  } catch (_) {}

  try {
    const firstBrace = result.indexOf("{");
    const lastBrace = result.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(result.substring(firstBrace, lastBrace + 1));
    }
  } catch (_) {}

  return { rawText: result, error: "Could not parse invoice data" };
}

// ============================================================================
// COMPREHENSIVE RULE-BASED ANALYSIS ENGINE (no API key needed)
// ============================================================================

interface CategoryCheck {
  name: string;
  weight: number; // how much this category impacts the score (out of 100 total)
  patterns: RegExp[];
  riskPatterns?: { pattern: RegExp; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; explanation: string; recommendation: string }[];
  missingProtection: { protection: string; importance: "HIGH" | "MEDIUM" | "LOW"; description: string };
  strengthMessage: string;
  suggestedClause: { name: string; text: string; reason: string };
}

const CATEGORY_CHECKS: CategoryCheck[] = [
  {
    name: "Payment Terms",
    weight: 10,
    patterns: [
      /net[\s-]?(15|30|45|60)/i,
      /payment\s+(is\s+)?due\s+(within|in)/i,
      /due\s+(on|upon)\s+receipt/i,
      /deposit/i,
      /milestone\s+payment/i,
      /payment\s+schedule/i,
      /retainer/i,
      /\d+%?\s*(up[\s-]?front|advance|deposit)/i,
    ],
    riskPatterns: [
      { pattern: /net[\s-]?60/i, severity: "HIGH", explanation: "Net-60 payment terms mean you wait 2 months for payment. This creates serious cash flow risk, especially for freelancers who need to cover expenses during the project.", recommendation: "Negotiate to Net-30 or request a 50% upfront deposit to offset the long payment cycle." },
      { pattern: /net[\s-]?45/i, severity: "MEDIUM", explanation: "Net-45 payment terms are longer than the industry standard of Net-30. This delays your cash flow unnecessarily.", recommendation: "Negotiate down to Net-30 terms, or add a 25-50% upfront deposit requirement." },
      { pattern: /payment\s+(upon|on|after)\s+(completion|delivery|acceptance|approval)/i, severity: "HIGH", explanation: "Payment only upon completion means you bear 100% of the financial risk. If the project takes months, you receive nothing until the end.", recommendation: "Restructure to milestone-based payments: 50% upfront, 25% at midpoint, 25% on completion." },
      { pattern: /no\s+(advance|deposit|upfront|retainer)\s+payment/i, severity: "HIGH", explanation: "Explicitly stating no advance payment puts all financial risk on you as the freelancer.", recommendation: "Add a deposit requirement of at least 25-50% before work begins." },
    ],
    missingProtection: { protection: "Payment Terms", importance: "HIGH", description: "Without defined payment terms, clients can delay payment indefinitely. You have no contractual basis to enforce timely payment or charge for late invoices." },
    strengthMessage: "Payment terms are clearly defined",
    suggestedClause: { name: "Payment Terms", text: "All invoices are due within thirty (30) days of issuance (\"Net 30\"). A non-refundable deposit of fifty percent (50%) of the total project fee is due before work commences. The remaining balance shall be invoiced upon delivery of final deliverables. Late payments shall accrue interest at a rate of 1.5% per month (18% annually). Contractor reserves the right to suspend all work if any invoice remains unpaid for more than fifteen (15) days past the due date, and to retain all work product until payment is received in full.", reason: "Ensures predictable cash flow, protects against non-payment, and gives you leverage if a client delays." },
  },
  {
    name: "Kill Fee / Cancellation",
    weight: 10,
    patterns: [
      /kill\s*fee/i,
      /cancell?ation/i,
      /cancel(l?ed|l?ing|s)?\s+(the\s+)?(project|agreement|contract|engagement|services|work)/i,
      /(project|agreement|contract|engagement|services|work)\s+(is\s+|may\s+be\s+)?cancel/i,
      /early\s+termination\s+(fee|penalty|charge|payment)/i,
      /termination\s+(fee|penalty|charge|compensation)/i,
      /break(\s*|-)?up\s+fee/i,
      /break\s+fee/i,
      /exit\s+fee/i,
      /right\s+to\s+cancel/i,
      /if\s+(the\s+)?(client|company|customer|party)\s+(decide|choose|elect|wish)s?\s+to\s+(cancel|terminate|end)/i,
      /upon\s+(cancellation|termination).{0,40}(pay|compensat|fee|owe|due|reimburse)/i,
      /(pay|compensat|fee|owe|due|reimburse).{0,40}(cancellation|termination)/i,
      /pro[\s-]?rat(ed|a)\s+(payment|compensation|fee)/i,
      /restocking\s+fee/i,
      /deposit.{0,30}(non[\s-]?refundable|retain|forfeit)/i,
    ],
    riskPatterns: [
      { pattern: /cancel\s+(at\s+)?any\s+time\s+(without|with\s+no)\s+(penalty|fee|charge|cost)/i, severity: "CRITICAL", explanation: "The client can cancel at any time with zero compensation to you. If you've turned down other work or invested significant time, you lose everything.", recommendation: "Add a sliding kill fee: 25% if canceled before start, 50% if canceled after work begins, 100% of completed work if canceled mid-project." },
      { pattern: /no\s+(cancellation|kill)\s+(fee|charge|penalty)/i, severity: "CRITICAL", explanation: "Explicitly waiving cancellation fees leaves you completely unprotected if the client pulls the plug.", recommendation: "Remove this clause and replace with a graduated kill fee structure." },
    ],
    missingProtection: { protection: "Kill Fee / Cancellation Policy", importance: "HIGH", description: "Without a kill fee, you have zero protection if the client cancels mid-project. You could lose weeks of work and income with no compensation for opportunity cost." },
    strengthMessage: "Kill fee / cancellation protection is included",
    suggestedClause: { name: "Kill Fee / Cancellation Clause", text: "In the event of project cancellation by Client:\n(a) If canceled more than fourteen (14) days before the agreed start date, no cancellation fee applies;\n(b) If canceled within fourteen (14) days of the start date, Client shall pay twenty-five percent (25%) of the total project fee as a cancellation fee;\n(c) If canceled after work has commenced, Client shall pay for all completed work at the agreed rate, plus fifty percent (50%) of the remaining project fee;\n(d) If canceled after delivery of draft deliverables, Client shall pay one hundred percent (100%) of the total project fee.\nAll cancellation fees are due within fifteen (15) days of the cancellation notice.", reason: "Protects against client cancellation after you have committed time, turned down other work, or invested in project-specific resources." },
  },
  {
    name: "IP Ownership",
    weight: 8,
    patterns: [
      /intellectual\s+property/i,
      /ip\s+(ownership|rights|transfer)/i,
      /copyright\s+(ownership|transfer|assign)/i,
      /ownership\s+of\s+(work|deliverable|material|content|design|code)/i,
      /all\s+rights\s+(shall\s+)?(transfer|vest|belong)/i,
      /work[\s-]product\s+ownership/i,
    ],
    riskPatterns: [
      { pattern: /all\s+(intellectual\s+property|ip|rights|work)\s+(shall\s+)?belong\s+to\s+(the\s+)?(client|company|employer)/i, severity: "HIGH", explanation: "Blanket IP transfer gives the client ownership of everything, potentially including your pre-existing tools, frameworks, and methodologies you bring to every project.", recommendation: "Limit IP transfer to project-specific deliverables only. Retain rights to pre-existing IP, tools, and general knowledge. Add: IP transfers only upon full payment." },
      { pattern: /ip\s+(transfer|vest).*immediately/i, severity: "HIGH", explanation: "Immediate IP transfer means the client owns your work before paying for it. If they don't pay, you've lost both the work and the IP rights.", recommendation: "Change to: IP rights transfer only upon receipt of full payment for the work." },
      { pattern: /work[\s-]?for[\s-]?hire/i, severity: "MEDIUM", explanation: "Work-for-hire designation means the client is legally considered the author from day one. You have no fallback rights if payment disputes arise.", recommendation: "If work-for-hire is required, ensure full payment triggers the transfer, and retain portfolio/display rights." },
    ],
    missingProtection: { protection: "IP Ownership Clause", importance: "HIGH", description: "Without an explicit IP clause, ownership is legally ambiguous. In many jurisdictions, the freelancer retains copyright by default, but this can lead to disputes. A clear clause protects both parties." },
    strengthMessage: "IP ownership terms are clearly defined",
    suggestedClause: { name: "IP Ownership & Transfer", text: "All intellectual property rights, including but not limited to copyrights, trademarks, patents, trade secrets, designs, code, copy, graphics, and creative assets produced specifically for this project (\"Work Product\") shall remain the sole property of Contractor until full payment has been received.\n\nUpon receipt of full and final payment, all IP rights in the Work Product shall transfer to Client. Contractor retains the right to:\n(a) Use the Work Product in their professional portfolio and marketing materials;\n(b) Retain ownership of all pre-existing intellectual property, tools, libraries, frameworks, and methodologies used in creating the Work Product;\n(c) Retain ownership of general knowledge, skills, and techniques developed during the project.\n\nIn the event of non-payment, all IP rights revert to Contractor.", reason: "Prevents the client from using your work without paying, preserves your portfolio rights, and protects your pre-existing tools and methodologies." },
  },
  {
    name: "Scope Definition",
    weight: 7,
    patterns: [
      /scope\s+of\s+work/i,
      /deliverable(s)?/i,
      /specification(s)?/i,
      /project\s+scope/i,
      /statement\s+of\s+work/i,
      /work\s+description/i,
      /services?\s+to\s+be\s+(provided|performed|delivered)/i,
    ],
    riskPatterns: [
      { pattern: /and\s+(any\s+)?other\s+(tasks?|work|services?|duties)\s+(as\s+)?(requested|needed|required|assigned)/i, severity: "HIGH", explanation: "Open-ended scope language like 'and any other tasks as needed' gives the client unlimited ability to expand scope without additional compensation. This is a classic scope creep trap.", recommendation: "Remove open-ended language. Define exact deliverables and add: 'Any work outside this scope requires a written change order and additional compensation.'" },
      { pattern: /scope\s+(may|can|will)\s+(be\s+)?(changed|modified|expanded|adjusted)\s+(at\s+)?(client|company)/i, severity: "HIGH", explanation: "Allowing the client to unilaterally change scope means your fixed-price quote can become an unlimited commitment.", recommendation: "Add a formal change order process that requires mutual written agreement and adjusted compensation for scope changes." },
    ],
    missingProtection: { protection: "Scope of Work Definition", importance: "HIGH", description: "Without a clear scope definition, there is no boundary on what the client can ask you to deliver. This leads to scope creep, unpaid extra work, and project disputes." },
    strengthMessage: "Scope of work is clearly defined",
    suggestedClause: { name: "Scope of Work & Change Orders", text: "The scope of work for this project is limited to the deliverables explicitly described in Exhibit A attached hereto (\"Deliverables\"). Any work requested by Client that falls outside the defined Deliverables shall constitute a \"Change Order\" and shall require:\n(a) A written request from Client describing the additional work;\n(b) A written estimate from Contractor detailing additional fees and timeline impact;\n(c) Written approval from both parties before additional work commences.\nContractor is not obligated to perform any work outside the agreed scope without a signed Change Order. Failure to obtain a Change Order does not waive Contractor's right to additional compensation for out-of-scope work performed at Client's request.", reason: "Prevents scope creep and ensures you are compensated for every piece of work you deliver." },
  },
  {
    name: "Revision Limits",
    weight: 5,
    patterns: [
      /revision(s)?/i,
      /round(s)?\s+of\s+(revision|change|feedback|edit)/i,
      /amendment(s)?/i,
      /change\s+request/i,
      /modification(s)?\s+(to|of)\s+(the\s+)?(deliverable|work|design)/i,
    ],
    riskPatterns: [
      { pattern: /unlimited\s+(revision|change|edit|modification)/i, severity: "HIGH", explanation: "Unlimited revisions means the client can request changes indefinitely, turning a fixed-price project into an endless engagement with no additional pay.", recommendation: "Limit to 2-3 rounds of revisions included in the project fee. Additional revisions billed at your hourly rate." },
      { pattern: /revision(s)?\s+(until|to)\s+(client\s+)?(satisfaction|approval|happy)/i, severity: "HIGH", explanation: "'Revisions until satisfaction' is subjective and unenforceable. A client can claim dissatisfaction indefinitely to avoid final payment.", recommendation: "Replace with a specific number of revision rounds and clear acceptance criteria." },
    ],
    missingProtection: { protection: "Revision Limits", importance: "MEDIUM", description: "Without revision limits, clients can request unlimited changes, effectively getting unlimited free work. This is one of the most common ways freelancers lose money." },
    strengthMessage: "Revision limits are specified",
    suggestedClause: { name: "Revision Policy", text: "This project includes two (2) rounds of revisions at no additional charge. Each revision round consists of one consolidated set of feedback from Client, delivered within five (5) business days of receiving deliverables.\n\nAdditional revision rounds beyond the included two (2) shall be billed at Contractor's standard hourly rate of $[RATE] per hour, with a minimum charge of one (1) hour per additional round.\n\nRevision requests must be specific, actionable, and consistent with the original project scope. Requests that constitute new work or scope changes will be handled through the Change Order process.", reason: "Prevents unlimited revision cycles and ensures fair compensation when clients request extra changes." },
  },
  {
    name: "Late Payment Penalties",
    weight: 6,
    patterns: [
      /late\s+(fee|payment|charge|penalty)/i,
      /interest\s+(on|for)\s+(late|overdue|unpaid)/i,
      /overdue\s+(payment|invoice|amount|balance)/i,
      /1\.5%\s*(per\s+)?month/i,
      /penalty\s+(for|on)\s+(late|overdue)/i,
      /past[\s-]due/i,
    ],
    riskPatterns: [
      { pattern: /no\s+(late\s+)?(fee|penalty|interest|charge)\s+(shall\s+)?(apply|be\s+charged)/i, severity: "HIGH", explanation: "Explicitly waiving late payment penalties removes any financial incentive for the client to pay on time.", recommendation: "Add a late payment interest clause of 1.5% per month on overdue balances." },
    ],
    missingProtection: { protection: "Late Payment Penalties", importance: "HIGH", description: "Without late payment penalties, there is no financial consequence for a client who pays late. Adding interest on overdue invoices incentivizes timely payment." },
    strengthMessage: "Late payment penalties are defined",
    suggestedClause: { name: "Late Payment Interest", text: "Any invoice not paid within the specified payment terms shall accrue interest at a rate of one and one-half percent (1.5%) per month (18% per annum), or the maximum rate permitted by applicable law, whichever is less, calculated from the due date until the date of actual payment.\n\nIn addition, Client shall be responsible for all costs of collection, including reasonable attorney's fees, incurred by Contractor in collecting overdue amounts.\n\nContractor reserves the right to suspend all work and withhold deliverables if any invoice remains unpaid for more than fifteen (15) days past the due date.", reason: "Creates a financial incentive for timely payment and gives you concrete leverage if a client falls behind." },
  },
  {
    name: "Termination Clause",
    weight: 6,
    patterns: [
      /termination/i,
      /terminate\s+(this\s+)?(agreement|contract)/i,
      /notice\s+(of\s+)?termination/i,
      /right\s+to\s+terminate/i,
      /at[\s-]will\s+termination/i,
      /(\d+)\s*(day|week)\s*(written\s+)?notice/i,
    ],
    riskPatterns: [
      { pattern: /client\s+(may|can|shall\s+have\s+the\s+right\s+to)\s+terminate\s+(this\s+)?(agreement|contract)\s+(at\s+any\s+time|immediately|without\s+(cause|notice|reason))/i, severity: "CRITICAL", explanation: "The client can terminate without notice, leaving you with no time to wrap up, no guaranteed payment for work in progress, and potentially no recourse.", recommendation: "Require a minimum 14-day written notice period for termination, with payment for all work completed up to the termination date." },
      { pattern: /terminate\s+(immediately|without\s+notice)\s+(for\s+)?(any|no)\s+reason/i, severity: "CRITICAL", explanation: "Immediate termination for any reason gives the client all the power and leaves you completely exposed.", recommendation: "Add mutual termination rights with 14-day notice and payment for all completed work." },
      { pattern: /contractor\s+(shall\s+)?not\s+(be\s+)?(entitled|eligible)\s+(to|for)\s+(any\s+)?(compensation|payment|fee)\s+(upon|after|following)\s+termination/i, severity: "CRITICAL", explanation: "Forfeiting all compensation upon termination means you could complete 90% of a project and receive nothing if the client terminates.", recommendation: "Add: 'Upon termination, Client shall pay for all work completed prior to the termination date, calculated on a pro-rata basis.'" },
    ],
    missingProtection: { protection: "Termination Clause", importance: "HIGH", description: "Without a termination clause, either party might be locked into the contract indefinitely, or the contract could be terminated without fair compensation for work already done." },
    strengthMessage: "Termination clause with notice period is included",
    suggestedClause: { name: "Termination Clause", text: "Either party may terminate this Agreement by providing fourteen (14) days' written notice to the other party.\n\nUpon termination:\n(a) Client shall pay Contractor for all work completed up to the effective date of termination, calculated on a pro-rata basis of the total project fee;\n(b) Client shall pay any outstanding invoices within fifteen (15) days of the termination date;\n(c) Contractor shall deliver all completed work product to Client upon receipt of full payment;\n(d) All provisions relating to confidentiality, IP ownership, liability, and dispute resolution shall survive termination.\n\nTermination for cause (material breach) requires written notice specifying the breach and a ten (10) day cure period before termination takes effect.", reason: "Ensures fair treatment for both parties when a project ends early and protects your right to payment for completed work." },
  },
  {
    name: "Non-Compete",
    weight: 5,
    patterns: [
      /non[\s-]?compete/i,
      /non[\s-]?competition/i,
      /restrict(ion|ed|ing)?\s+(from\s+)?(work|contract|engag|compet)/i,
      /competing\s+(business|service|work)/i,
      /exclusiv(e|ity)/i,
    ],
    riskPatterns: [
      { pattern: /non[\s-]?compete.*(\d+)\s*(year|month)/i, severity: "HIGH", explanation: "A non-compete clause restricts your ability to take on similar work, potentially limiting your income for months or years after this project ends.", recommendation: "Negotiate to remove entirely, or narrow to direct competitors only with a maximum 3-month duration and geographic limit." },
      { pattern: /shall\s+not\s+(work|contract|engage|provide\s+services)\s+(with|for|to)\s+(any|other)/i, severity: "HIGH", explanation: "A broad restriction on working with other clients in similar areas can devastate a freelancer's livelihood.", recommendation: "Remove or narrowly tailor to only prevent soliciting this specific client's existing customers." },
      { pattern: /exclusiv(e|ity)/i, severity: "MEDIUM", explanation: "An exclusivity clause prevents you from working with competitors or in similar fields during the engagement. As a freelancer, this significantly limits your income potential.", recommendation: "Remove exclusivity or negotiate a premium rate (typically 50-100% higher) to compensate for lost opportunity." },
    ],
    missingProtection: { protection: "Non-Compete Scope Limitation", importance: "LOW", description: "If a non-compete is present, it should be narrowly scoped. If absent, this actually benefits you as a freelancer—no action needed unless the client tries to add one." },
    strengthMessage: "No overly restrictive non-compete provisions found",
    suggestedClause: { name: "Non-Compete Limitation", text: "Contractor operates an independent business serving multiple clients. Nothing in this Agreement shall restrict Contractor from engaging in similar work for other clients, provided that Contractor does not:\n(a) Directly solicit Client's existing customers using confidential information obtained under this Agreement;\n(b) Use Client's proprietary materials or trade secrets for the benefit of a competing project.\n\nAny exclusivity arrangement requires separate written agreement and additional compensation.", reason: "Protects your freedom to work with multiple clients, which is fundamental to operating as a freelancer." },
  },
  {
    name: "Confidentiality",
    weight: 4,
    patterns: [
      /confidential/i,
      /non[\s-]?disclosure/i,
      /\bnda\b/i,
      /proprietary\s+information/i,
      /trade\s+secret/i,
      /confidential\s+information/i,
    ],
    riskPatterns: [
      { pattern: /confidential.*perpetual|indefinite|forever|no\s+expir/i, severity: "MEDIUM", explanation: "A perpetual confidentiality obligation means you can never discuss any aspect of this work, which can hinder your career and portfolio development.", recommendation: "Limit confidentiality to 2-3 years and explicitly exclude portfolio/case study rights for non-sensitive work." },
      { pattern: /all\s+(information|data|materials?)\s+(shared|provided|disclosed).*confidential/i, severity: "MEDIUM", explanation: "Designating ALL information as confidential is overly broad and makes it impossible to separate truly sensitive information from general business knowledge.", recommendation: "Require confidential information to be clearly marked or designated in writing." },
    ],
    missingProtection: { protection: "Confidentiality / NDA", importance: "MEDIUM", description: "Without a confidentiality clause, there is no formal obligation to protect shared information. A mutual NDA protects both your methods and the client's sensitive data." },
    strengthMessage: "Confidentiality protections are in place",
    suggestedClause: { name: "Mutual Confidentiality / NDA", text: "Both parties agree to maintain the confidentiality of any proprietary or sensitive information disclosed during the course of this engagement (\"Confidential Information\"). Confidential Information must be clearly marked as \"Confidential\" or designated as such in writing.\n\nConfidential Information does not include information that:\n(a) Is or becomes publicly available through no fault of the receiving party;\n(b) Was known to the receiving party prior to disclosure;\n(c) Is independently developed without use of Confidential Information;\n(d) Is required to be disclosed by law or court order.\n\nThis confidentiality obligation shall survive termination of this Agreement for a period of two (2) years.\n\nNotwithstanding the above, Contractor retains the right to reference this project in their professional portfolio and marketing materials, excluding any Confidential Information.", reason: "Provides mutual protection while preserving your right to reference the work in your portfolio." },
  },
  {
    name: "Liability Cap",
    weight: 5,
    patterns: [
      /limitation\s+of\s+liability/i,
      /liability\s+(shall\s+)?(not\s+)?exceed/i,
      /maximum\s+liability/i,
      /cap\s+(on\s+)?liability/i,
      /aggregate\s+liability/i,
      /in\s+no\s+event\s+shall.*liable/i,
    ],
    riskPatterns: [
      { pattern: /contractor.*liable\s+for\s+(any\s+and\s+)?all\s+(damages?|losses?|claims?)/i, severity: "CRITICAL", explanation: "Unlimited liability means a single mistake could expose you to damages far exceeding what you were paid for the project. This is existentially risky.", recommendation: "Add a liability cap limiting your total exposure to the amount paid under this contract." },
      { pattern: /consequential|indirect|special|punitive|incidental\s+damages/i, severity: "MEDIUM", explanation: "Liability for consequential, indirect, or punitive damages could expose you to claims for lost profits, reputational damage, or other amounts far exceeding the project value.", recommendation: "Explicitly exclude consequential, indirect, special, and punitive damages from your liability." },
    ],
    missingProtection: { protection: "Liability Cap", importance: "HIGH", description: "Without a liability cap, you are exposed to potentially unlimited financial risk. Even a small project could lead to claims exceeding your annual income." },
    strengthMessage: "Liability is capped appropriately",
    suggestedClause: { name: "Limitation of Liability", text: "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CONTRACTOR'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES ACTUALLY PAID BY CLIENT TO CONTRACTOR UNDER THIS AGREEMENT.\n\nIN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, LOSS OF BUSINESS OPPORTUNITIES, OR REPUTATIONAL HARM, REGARDLESS OF WHETHER SUCH DAMAGES ARE BASED ON CONTRACT, TORT, STRICT LIABILITY, OR ANY OTHER THEORY.\n\nThis limitation applies regardless of whether the party has been advised of the possibility of such damages.", reason: "Limits your maximum financial exposure to the project value and excludes speculative damages that could be financially devastating." },
  },
  {
    name: "Indemnification",
    weight: 5,
    patterns: [
      /indemnif/i,
      /hold\s+harmless/i,
      /defend\s+and\s+indemnif/i,
    ],
    riskPatterns: [
      { pattern: /contractor\s+shall\s+(defend,?\s+)?indemnif/i, severity: "HIGH", explanation: "A one-sided indemnification clause makes only you responsible for legal defense costs and damages, even for issues that may not be your fault.", recommendation: "Make indemnification mutual: both parties indemnify each other for their own negligence and breaches." },
      { pattern: /indemnif.*any\s+and\s+all\s+(claims?|damages?|losses?|costs?)/i, severity: "HIGH", explanation: "Broad indemnification for 'any and all claims' could make you liable for things completely outside your control, including the client's own negligence.", recommendation: "Narrow indemnification to only cover claims directly arising from your breach or negligence, not all claims." },
    ],
    missingProtection: { protection: "Indemnification Clause", importance: "MEDIUM", description: "Without an indemnification clause, responsibilities for third-party claims are unclear. A mutual indemnification clause ensures each party takes responsibility for their own actions." },
    strengthMessage: "Indemnification terms are defined",
    suggestedClause: { name: "Mutual Indemnification", text: "Each party (\"Indemnifying Party\") shall indemnify, defend, and hold harmless the other party and its officers, directors, employees, and agents from and against any third-party claims, damages, losses, liabilities, and expenses (including reasonable attorney's fees) arising out of or related to:\n(a) The Indemnifying Party's breach of this Agreement;\n(b) The Indemnifying Party's negligence or willful misconduct;\n(c) The Indemnifying Party's violation of applicable law.\n\nThe indemnification obligations under this section are subject to the Limitation of Liability provisions set forth herein.", reason: "Ensures both parties share responsibility fairly rather than putting all risk on the freelancer." },
  },
  {
    name: "Dispute Resolution",
    weight: 4,
    patterns: [
      /dispute\s+resolution/i,
      /arbitration/i,
      /mediation/i,
      /jurisdiction/i,
      /governing\s+law/i,
      /venue/i,
      /choice\s+of\s+law/i,
    ],
    riskPatterns: [
      { pattern: /exclusive\s+jurisdiction.*\b(new york|california|london|delaware)\b/i, severity: "MEDIUM", explanation: "A distant jurisdiction clause could force you to travel and hire attorneys far from home to resolve disputes, making it financially impractical to pursue claims.", recommendation: "Negotiate for disputes to be resolved in your local jurisdiction, or agree on neutral online arbitration." },
      { pattern: /waive.*right.*jury\s+trial/i, severity: "MEDIUM", explanation: "Waiving your right to a jury trial means all disputes go to a judge, which may be less favorable for individual freelancers.", recommendation: "Consider whether this limitation is acceptable. For small claims, arbitration may actually be faster and cheaper." },
    ],
    missingProtection: { protection: "Dispute Resolution Process", importance: "MEDIUM", description: "Without a dispute resolution clause, any disagreement could escalate directly to expensive litigation. A mediation-first approach is faster, cheaper, and less adversarial." },
    strengthMessage: "Dispute resolution process is specified",
    suggestedClause: { name: "Dispute Resolution", text: "Any dispute arising out of or relating to this Agreement shall be resolved as follows:\n\n1. NEGOTIATION: The parties shall first attempt to resolve the dispute through good-faith negotiation within thirty (30) days of written notice of the dispute.\n\n2. MEDIATION: If negotiation fails, the parties shall submit the dispute to mediation administered by a mutually agreed-upon mediator. The costs of mediation shall be shared equally.\n\n3. BINDING ARBITRATION: If mediation does not resolve the dispute within sixty (60) days, the dispute shall be submitted to binding arbitration under the rules of the American Arbitration Association. The arbitration shall take place in [CONTRACTOR'S CITY/STATE].\n\n4. GOVERNING LAW: This Agreement shall be governed by the laws of the State of [CONTRACTOR'S STATE], without regard to conflicts of law principles.", reason: "Provides a structured, cost-effective path to resolve disputes without immediately resorting to expensive litigation." },
  },
  {
    name: "Work-for-Hire",
    weight: 5,
    patterns: [
      /work[\s-]?for[\s-]?hire/i,
      /work\s+made\s+for\s+hire/i,
      /assignment\s+of\s+(all\s+)?(rights|ip|intellectual)/i,
      /ownership\s+transfer/i,
      /hereby\s+assign/i,
    ],
    riskPatterns: [
      { pattern: /work[\s-]?for[\s-]?hire/i, severity: "MEDIUM", explanation: "A work-for-hire designation means the client is legally considered the original author of everything you create. You have no residual rights, no portfolio usage rights, and no fallback if payment disputes arise.", recommendation: "If work-for-hire is required, negotiate for: (1) IP transfer only upon full payment, (2) portfolio/display rights retained, (3) pre-existing IP excluded." },
      { pattern: /assign.*all\s+right.*title.*interest/i, severity: "MEDIUM", explanation: "A broad assignment of 'all right, title, and interest' transfers everything, potentially including your pre-existing tools, templates, and methodologies.", recommendation: "Limit assignment to project-specific deliverables. Explicitly exclude pre-existing IP, tools, and general knowledge." },
    ],
    missingProtection: { protection: "Work-for-Hire Clarification", importance: "MEDIUM", description: "If the contract involves creative or technical work, it should clarify whether this is work-for-hire and define exactly what IP is being transferred." },
    strengthMessage: "Work-for-hire terms are clearly defined with appropriate protections",
    suggestedClause: { name: "Work-for-Hire & IP Assignment", text: "To the extent that any Work Product qualifies as \"work made for hire\" under applicable copyright law, it shall be deemed work made for hire. To the extent any Work Product does not qualify as work made for hire, Contractor hereby assigns to Client all right, title, and interest in such Work Product, effective only upon receipt of full payment.\n\nNotwithstanding the foregoing:\n(a) Contractor retains all rights to pre-existing intellectual property, tools, libraries, frameworks, and methodologies;\n(b) Contractor retains the right to use Work Product in their professional portfolio;\n(c) In the event of non-payment, all assigned rights automatically revert to Contractor.", reason: "Provides the client with the IP rights they need while protecting your pre-existing assets and portfolio rights." },
  },
  {
    name: "Deliverable Specifications",
    weight: 4,
    patterns: [
      /acceptance\s+criteria/i,
      /specifications?\s+(for|of)/i,
      /deliverable\s+spec/i,
      /milestone(s)?/i,
      /deliverable\s+schedule/i,
      /acceptance\s+(process|period|review)/i,
      /final\s+deliverable/i,
    ],
    riskPatterns: [
      { pattern: /client\s+(sole|absolute|exclusive)\s+(discretion|judgment|satisfaction)/i, severity: "HIGH", explanation: "Subjective acceptance criteria based on the client's 'sole discretion' means they can reject completed work for any reason, including reasons unrelated to quality.", recommendation: "Replace with objective, measurable acceptance criteria and a defined review period (e.g., 5 business days)." },
    ],
    missingProtection: { protection: "Deliverable Specifications & Acceptance Criteria", importance: "MEDIUM", description: "Without clear specifications and acceptance criteria, disputes about what constitutes 'completed' work are inevitable. Define what 'done' means upfront." },
    strengthMessage: "Deliverable specifications and acceptance criteria are defined",
    suggestedClause: { name: "Deliverable Acceptance", text: "Upon delivery of each milestone or final deliverable, Client shall have five (5) business days to review and either accept the deliverable or provide specific, written feedback identifying how the deliverable fails to meet the agreed specifications (\"Review Period\").\n\nIf Client does not respond within the Review Period, the deliverable shall be deemed accepted.\n\nRejection must be based solely on failure to meet the specifications outlined in the Scope of Work. Subjective preferences or changes in direction do not constitute valid grounds for rejection and shall be handled through the Change Order process.\n\nAccepted deliverables are final. Any subsequent changes constitute a new revision round.", reason: "Prevents clients from holding deliverables hostage with subjective or ever-changing requirements." },
  },
  {
    name: "Timeline / Deadlines",
    weight: 4,
    patterns: [
      /deadline/i,
      /timeline/i,
      /completion\s+date/i,
      /delivery\s+date/i,
      /due\s+date/i,
      /schedule/i,
      /estimated\s+(completion|delivery)/i,
      /project\s+timeline/i,
    ],
    riskPatterns: [
      { pattern: /time\s+is\s+of\s+the\s+essence/i, severity: "HIGH", explanation: "'Time is of the essence' is a legal term that makes deadlines absolute obligations. Missing a deadline by even one day could be considered a material breach, allowing the client to terminate and potentially claim damages.", recommendation: "Remove 'time is of the essence' or ensure all deadlines account for client feedback delays, approval bottlenecks, and unforeseen complications." },
      { pattern: /penalty\s+(for|on)\s+(late|missed|delayed)\s+deliver/i, severity: "MEDIUM", explanation: "Financial penalties for late delivery put all timeline risk on you, even when delays are caused by the client's late feedback, scope changes, or approval bottlenecks.", recommendation: "Add mutual timeline responsibilities: deadlines are extended by any period of client delay in providing feedback, assets, or approvals." },
    ],
    missingProtection: { protection: "Timeline / Deadline Provisions", importance: "MEDIUM", description: "Without defined timelines, there is no mutual understanding of when work is due or how delays are handled." },
    strengthMessage: "Project timeline and milestones are defined",
    suggestedClause: { name: "Timeline & Delay Provisions", text: "The project timeline is outlined in Exhibit A. All dates are estimates based on timely receipt of Client feedback, assets, approvals, and other Client-dependent items.\n\nProject deadlines shall be automatically extended by a period equal to any delay caused by:\n(a) Late or incomplete feedback from Client;\n(b) Delayed approval or sign-off from Client;\n(c) Scope changes or additions requested by Client;\n(d) Force Majeure events as defined herein.\n\nContractor shall promptly notify Client of any anticipated delays and provide a revised timeline.", reason: "Ensures deadlines are fair and account for client-side delays, preventing you from being penalized for things outside your control." },
  },
  {
    name: "Subcontracting Rights",
    weight: 3,
    patterns: [
      /subcontract/i,
      /sub[\s-]?contractor/i,
      /assign\s+(this\s+)?(agreement|contract)/i,
      /delegate/i,
      /third[\s-]?party\s+(contractor|provider|vendor)/i,
    ],
    riskPatterns: [
      { pattern: /shall\s+not\s+(subcontract|assign|delegate)/i, severity: "LOW", explanation: "A blanket prohibition on subcontracting limits your flexibility to bring in specialists or manage your workload efficiently.", recommendation: "Negotiate for the right to subcontract with prior written consent, which shall not be unreasonably withheld." },
    ],
    missingProtection: { protection: "Subcontracting / Assignment Rights", importance: "LOW", description: "If you may need to bring in subcontractors or collaborate with specialists, the contract should clarify whether this is permitted." },
    strengthMessage: "Subcontracting terms are addressed",
    suggestedClause: { name: "Subcontracting Rights", text: "Contractor may engage qualified subcontractors to assist in the performance of services under this Agreement, provided that:\n(a) Contractor obtains Client's prior written consent, which shall not be unreasonably withheld;\n(b) Contractor remains fully responsible for all work performed by subcontractors;\n(c) All subcontractors are bound by confidentiality obligations no less restrictive than those in this Agreement.\n\nNeither party may assign this Agreement without the prior written consent of the other party.", reason: "Gives you flexibility to manage your team and workload while keeping the client informed." },
  },
  {
    name: "Force Majeure",
    weight: 3,
    patterns: [
      /force\s+majeure/i,
      /act(s)?\s+of\s+god/i,
      /unforeseeable\s+(event|circumstance)/i,
      /beyond\s+(the\s+)?(reasonable\s+)?control/i,
      /natural\s+disaster/i,
      /pandemic/i,
    ],
    riskPatterns: [],
    missingProtection: { protection: "Force Majeure Clause", importance: "MEDIUM", description: "Without force majeure protection, you could be held in breach for delays caused by events completely beyond your control—natural disasters, pandemics, internet outages, government actions, etc." },
    strengthMessage: "Force majeure protection is included",
    suggestedClause: { name: "Force Majeure", text: "Neither party shall be liable for any delay or failure to perform its obligations under this Agreement if such delay or failure results from circumstances beyond the reasonable control of the affected party, including but not limited to:\n(a) Natural disasters (earthquake, flood, hurricane, fire);\n(b) Epidemic or pandemic;\n(c) War, terrorism, civil unrest, or government action;\n(d) Prolonged power outage or internet service disruption;\n(e) Cyberattack or system failure beyond the party's control.\n\nThe affected party shall notify the other party promptly and take reasonable steps to mitigate the impact. If the force majeure event continues for more than thirty (30) days, either party may terminate this Agreement without penalty, with payment due for all work completed prior to the event.", reason: "Protects both parties from liability for events that are genuinely beyond anyone's control." },
  },
];

function generateDemoAnalysis(text: string): string {
  const lower = text.toLowerCase();
  const risks: any[] = [];
  const missing: any[] = [];
  const strengths: string[] = [];
  const suggestedClauses: any[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const category of CATEGORY_CHECKS) {
    totalWeight += category.weight;

    // Check if this category is present in the contract
    const found = category.patterns.some((p) => p.test(text));

    if (found) {
      earnedWeight += category.weight;
      strengths.push(category.strengthMessage);

      // Check for risky patterns within found categories
      if (category.riskPatterns) {
        for (const rp of category.riskPatterns) {
          const match = text.match(rp.pattern);
          if (match) {
            // Partial deduction for risky patterns within found category
            earnedWeight -= category.weight * 0.4;
            risks.push({
              category: category.name,
              severity: rp.severity,
              clause: match[0].substring(0, 200),
              explanation: rp.explanation,
              recommendation: rp.recommendation,
            });
          }
        }
      }
    } else {
      // Category missing
      missing.push(category.missingProtection);
      suggestedClauses.push(category.suggestedClause);

      // Add a risk for critically important missing categories
      if (category.missingProtection.importance === "HIGH") {
        risks.push({
          category: category.name,
          severity: "HIGH" as const,
          clause: `No ${category.name.toLowerCase()} clause found in this contract`,
          explanation: category.missingProtection.description,
          recommendation: `Add a ${category.name.toLowerCase()} clause. See suggested clauses below for copy-paste language.`,
        });
      }
    }
  }

  // Calculate score: base it on weighted categories
  let score = Math.round((earnedWeight / totalWeight) * 100);
  score = Math.max(10, Math.min(95, score));

  // Determine risk level
  let riskLevel: string;
  if (score >= 75) riskLevel = "LOW";
  else if (score >= 55) riskLevel = "MEDIUM";
  else if (score >= 35) riskLevel = "HIGH";
  else riskLevel = "CRITICAL";

  // Sort risks by severity
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  risks.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

  // Build a contextual summary
  const criticalCount = risks.filter((r) => r.severity === "CRITICAL").length;
  const highCount = risks.filter((r) => r.severity === "HIGH").length;

  let summary: string;
  if (score >= 75) {
    summary = `This contract covers ${strengths.length} of 17 key categories and provides solid freelancer protections. ${missing.length > 0 ? `However, ${missing.length} protection${missing.length > 1 ? "s are" : " is"} still missing. Review the suggestions below to strengthen your position.` : "All major protections are present."}`;
  } else if (score >= 55) {
    summary = `This contract has moderate protections but is missing ${missing.length} key categories. ${criticalCount > 0 ? `There ${criticalCount === 1 ? "is" : "are"} ${criticalCount} critical risk${criticalCount > 1 ? "s" : ""} that should be addressed immediately.` : `${highCount} high-severity risks need attention before signing.`} Review the suggested clauses below.`;
  } else if (score >= 35) {
    summary = `This contract has significant gaps that put you at risk. Only ${strengths.length} of 17 protection categories are present, and ${risks.length} risks were identified. Do not sign without adding the suggested clauses, especially for payment terms, kill fee, and liability.`;
  } else {
    summary = `This contract is critically lacking in freelancer protections. With only ${strengths.length} of 17 categories addressed and ${criticalCount + highCount} critical/high risks, signing this as-is would leave you highly exposed. Major revisions are needed.`;
  }

  // Limit suggested clauses to the most impactful 4
  const prioritizedClauses = suggestedClauses.slice(0, 4);

  return JSON.stringify({
    overallScore: score,
    riskLevel,
    summary,
    risks,
    missingProtections: missing,
    strengths,
    suggestedClauses: prioritizedClauses,
  });
}
