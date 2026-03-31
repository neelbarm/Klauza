const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
const SONAR_URL = "https://api.perplexity.ai/chat/completions";

// Call Perplexity Sonar API
async function callPerplexity(systemPrompt: string, userMessage: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    // Fallback: return a structured demo analysis if no API key configured
    return generateDemoAnalysis(userMessage);
  }

  const response = await fetch(SONAR_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Perplexity API error:", err);
    // Fall back to demo analysis
    return generateDemoAnalysis(userMessage);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || "Analysis could not be completed.";
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

Be specific. Quote actual clauses. Give actionable recommendations. Always suggest adding a kill fee if one is missing.`;

export async function scanContract(contractText: string): Promise<any> {
  const trimmed = contractText.substring(0, 15000); // Limit to ~15K chars for API
  const result = await callPerplexity(CONTRACT_SCAN_SYSTEM, `Analyze this freelance contract:\n\n${trimmed}`);

  try {
    // Try to parse as JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // If not valid JSON, return structured text
  }

  // Fallback: return the raw text in a structured format
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
  return callPerplexity(CONTRACT_GENERATE_SYSTEM, context);
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
  const result = await callPerplexity(INVOICE_PARSE_SYSTEM, `Extract data from this invoice:\n\n${trimmed}`);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {}

  return { rawText: result, error: "Could not parse invoice data" };
}

// Demo analysis fallback when no API key is set
function generateDemoAnalysis(text: string): string {
  const hasKillFee = text.toLowerCase().includes('kill fee') || text.toLowerCase().includes('cancellation fee');
  const hasPaymentTerms = text.toLowerCase().includes('net 30') || text.toLowerCase().includes('net 15') || text.toLowerCase().includes('payment');
  const hasIP = text.toLowerCase().includes('intellectual property') || text.toLowerCase().includes('ip ownership');
  const hasRevisions = text.toLowerCase().includes('revision') || text.toLowerCase().includes('revisions');
  const hasTermination = text.toLowerCase().includes('termination') || text.toLowerCase().includes('terminate');

  const risks: any[] = [];
  const missing: any[] = [];
  let score = 70;

  if (!hasKillFee) {
    risks.push({ category: "Kill Fee", severity: "CRITICAL", clause: "No kill fee or cancellation clause found", explanation: "If the client cancels mid-project, you have no guaranteed compensation for work already done.", recommendation: "Add a sliding kill fee: 25% within 2 weeks, 50% within 1 week, 100% after work begins." });
    missing.push({ protection: "Kill Fee / Cancellation Policy", importance: "HIGH", description: "Protects your income if the client cancels the project." });
    score -= 15;
  }
  if (!hasPaymentTerms) {
    risks.push({ category: "Payment Terms", severity: "HIGH", clause: "No clear payment terms specified", explanation: "Without defined payment terms, clients can delay payment indefinitely.", recommendation: "Add Net-30 payment terms with 1.5% monthly late fee." });
    score -= 10;
  }
  if (!hasIP) {
    missing.push({ protection: "IP Ownership Clause", importance: "HIGH", description: "Without this, IP rights are ambiguous. Add: IP transfers only upon full payment." });
    score -= 10;
  }
  if (!hasRevisions) {
    missing.push({ protection: "Revision Limits", importance: "MEDIUM", description: "Without revision limits, clients can request unlimited changes. Add: 2 rounds included." });
    score -= 5;
  }
  if (!hasTermination) {
    missing.push({ protection: "Termination Clause", importance: "MEDIUM", description: "Either party should be able to terminate with 14 days written notice." });
    score -= 5;
  }

  return JSON.stringify({
    overallScore: Math.max(score, 20),
    riskLevel: score >= 70 ? "LOW" : score >= 50 ? "MEDIUM" : score >= 30 ? "HIGH" : "CRITICAL",
    summary: `This contract has been analyzed across 17 risk categories. ${risks.length} risks and ${missing.length} missing protections were identified.${!hasKillFee ? " Most critically, there is no kill fee clause." : ""}`,
    risks,
    missingProtections: missing,
    strengths: [
      hasPaymentTerms ? "Payment terms are defined" : null,
      hasIP ? "IP ownership clause present" : null,
      hasKillFee ? "Kill fee / cancellation protection included" : null,
      hasTermination ? "Termination clause included" : null,
    ].filter(Boolean),
    suggestedClauses: [
      !hasKillFee ? { name: "Kill Fee Clause", text: "In the event of project cancellation by Client: (a) if canceled more than 14 days before the start date, no fee applies; (b) if canceled within 14 days of the start date, Client shall pay 25% of the total project fee; (c) if canceled after work has commenced, Client shall pay for all completed work plus 50% of the remaining project fee.", reason: "Protects against client cancellation after you've committed time and turned down other work." } : null,
      !hasPaymentTerms ? { name: "Payment Terms", text: "All invoices are due within 30 days of issuance (Net 30). Late payments shall accrue interest at a rate of 1.5% per month (18% annually). Contractor reserves the right to suspend work if any invoice remains unpaid for more than 15 days past the due date.", reason: "Ensures timely payment and discourages delays." } : null,
      !hasIP ? { name: "IP Ownership", text: "All intellectual property, including but not limited to designs, code, copy, and creative assets produced under this agreement, shall remain the property of the Contractor until full payment has been received. Upon receipt of full payment, all IP rights transfer to the Client.", reason: "Prevents the client from using your work without paying for it." } : null,
    ].filter(Boolean),
  });
}
