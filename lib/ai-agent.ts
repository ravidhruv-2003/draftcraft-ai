import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ToneSettings, DraftType } from '@/types/draft';
import { estimateTokens } from './optimizer';
import { resolveClaudeModel } from './pricing';

interface GenerateParams {
  prompt: string;
  referenceContext?: string;
  draftType: DraftType;
  recipientRole?: string;
  toneSettings: ToneSettings;
  model?: string;
  apiKey?: string;
}

interface GenerateResult {
  content: string;
  subjectLine?: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

/**
 * Builds system prompt enforcing professional drafting conventions and tone
 */
function buildSystemPrompt(toneSettings: ToneSettings, draftType: DraftType, recipientRole?: string): string {
  const formalityLabels: Record<number, string> = {
    1: 'Casual and relaxed',
    2: 'Conversational and warm',
    3: 'Professional and courteous',
    4: 'Formal and business-appropriate',
    5: 'Executive, legal, and highly formal',
  };

  const directnessLabels: Record<number, string> = {
    1: 'Gentle, diplomatic, and indirect',
    2: 'Polite and considerate',
    3: 'Balanced and clear',
    4: 'Direct and assertive',
    5: 'Urgent, firm, and decisive',
  };

  return `You are an elite Executive Writing Assistant specialized in crafting high-impact ${draftType.replace('_', ' ')}s.
Target Audience / Recipient: ${recipientRole || 'Professional colleague or client'}.
Tone Directives:
- Preset: ${toneSettings.preset.toUpperCase()}
- Formality Level: ${toneSettings.formality}/5 (${formalityLabels[toneSettings.formality] || 'Professional'})
- Directness Level: ${toneSettings.directness}/5 (${directnessLabels[toneSettings.directness] || 'Balanced'})
- Target Length: ${toneSettings.length.toUpperCase()}

Formatting Rules:
1. Always start with a compelling, relevant subject line on the very first line prefixed with "Subject: ".
2. Include a proper greeting/salutation matching the formality level.
3. Keep paragraphs well-spaced, scannable, and actionable.
4. If action is required, end with a crisp Call-To-Action (CTA).
5. Add an appropriate professional sign-off and placeholder signature (e.g. [Your Name], [Your Title]).
6. Never output conversational preamble like "Here is your email:". Output ONLY the draft content.`;
}

export async function runAIGeneration(params: GenerateParams): Promise<GenerateResult> {
  const {
    prompt,
    referenceContext,
    draftType,
    recipientRole,
    toneSettings,
    model = 'claude-sonnet-4-5-20250929',
    apiKey,
  } = params;

  // Prioritize user's private key passed securely from browser localStorage, then fall back to server env
  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';

  const systemPrompt = buildSystemPrompt(toneSettings, draftType, recipientRole);
  const userContent = referenceContext
    ? `Reference Material:\n"""\n${referenceContext}\n"""\n\nInstructions:\n${prompt}`
    : prompt;

  // 1. If Anthropic Claude API Key is configured
  if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
    try {
      const activeModel = resolveClaudeModel(model);
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const response = await anthropic.messages.create({
        model: activeModel,
        max_tokens: 1500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

      const firstBlock = response.content[0];
      const text = firstBlock.type === 'text' ? firstBlock.text : '';

      // Extract subject line if present
      let subjectLine = '';
      const subjectMatch = text.match(/^Subject:\s*(.*)$/im);
      if (subjectMatch) {
        subjectLine = subjectMatch[1].trim();
      }

      return {
        content: text,
        subjectLine,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        modelUsed: activeModel,
      };
    } catch (err: unknown) {
      console.error('Claude API call error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('ENOTFOUND') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('fetch failed') ||
        msg.includes('ConnectTimeoutError') ||
        msg.toLowerCase().includes('timeout') ||
        msg.includes('UND_ERR') ||
        msg.includes('no such host')
      ) {
        throw new Error('System is currently offline: Unable to connect to Claude AI servers (Connection timed out). Please check your internet connection and try again.');
      }
      throw new Error(`Claude AI error: ${msg}`);
    }
  }

  // 2. Fallback to Gemini if GEMINI_API_KEY is available
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      });

      const result = await geminiModel.generateContent(userContent);
      const text = result.response.text();

      let subjectLine = '';
      const subjectMatch = text.match(/^Subject:\s*(.*)$/im);
      if (subjectMatch) {
        subjectLine = subjectMatch[1].trim();
      }

      const inputTokens = estimateTokens(systemPrompt + userContent);
      const outputTokens = estimateTokens(text);

      return {
        content: text,
        subjectLine,
        inputTokens,
        outputTokens,
        modelUsed: 'gemini-1.5-flash',
      };
    } catch (err) {
      console.error('Gemini API call error:', err);
    }
  }

  // 3. High-Fidelity Local AI Simulation Engine (Allows testing out-of-the-box before keys are pasted)
  const mockSubject = `Subject: ${generateMockSubject(prompt, draftType)}`;
  const mockBody = generateMockDraft(prompt, referenceContext, draftType, toneSettings, recipientRole);
  const fullContent = `${mockSubject}\n\n${mockBody}`;

  const inputTokens = estimateTokens(systemPrompt + userContent);
  const outputTokens = estimateTokens(fullContent);

  return {
    content: fullContent,
    subjectLine: mockSubject.replace('Subject: ', ''),
    inputTokens,
    outputTokens,
    modelUsed: `${model} (Sandbox)`,
  };
}

function generateMockSubject(prompt: string, draftType: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('follow') || draftType === 'follow_up') return 'Following up on our recent discussion & next steps';
  if (p.includes('interview')) return 'Thank you for the opportunity – Follow-up after interview';
  if (p.includes('delay') || p.includes('postpone')) return 'Important Project Timeline Update & Mitigation Plan';
  if (p.includes('pitch') || p.includes('outreach') || draftType === 'outreach') return 'Exploring collaboration: Custom solutions for your team';
  if (p.includes('resignation')) return 'Notice of Resignation – [Your Name]';
  if (p.includes('salary') || p.includes('compensation')) return 'Request for Compensation Review & Discussion';
  if (p.includes('apology') || draftType === 'apology') return 'Resolution Update: Addressing Recent Notice';
  return `Discussion & Proposed Action Items regarding ${prompt.slice(0, 30).trim()}`;
}

function generateMockDraft(
  prompt: string,
  referenceContext: string | undefined,
  draftType: string,
  tone: ToneSettings,
  recipient?: string
): string {
  const p = prompt.toLowerCase();
  const salutation =
    tone.formality >= 4
      ? `Dear ${recipient || '[Recipient Name]'},`
      : `Hi ${recipient || '[Name]'},`;

  const signOff =
    tone.formality >= 4
      ? 'Sincerely,\n\n[Your Name]\n[Your Title]\n[Your Contact Information]'
      : 'Best regards,\n\n[Your Name]';

  // Check specific intent in user's prompt
  if (p.includes('follow') || p.includes('replied') || draftType === 'follow_up') {
    return `${salutation}

I hope you are having a productive week. I am following up on my previous message to ensure you had all the necessary details and to see if you had any questions regarding our proposal.

We would be delighted to partner with your team. If you have 10 minutes available this week, please let me know a convenient time for a brief call, or feel free to reply with your feedback.

${signOff}`;
  }

  if (p.includes('delay') || p.includes('postpone')) {
    return `${salutation}

I am writing to provide a transparent status update regarding our current delivery milestone. Due to unforeseen security and integration requirements, our projected completion date has been adjusted by two business days to ensure optimal quality.

All core features are currently completed and passing quality benchmarks. We are conducting final regression tests to guarantee a seamless release.

Thank you for your understanding and ongoing partnership. I will provide another status report on Thursday morning.

${signOff}`;
  }

  if (p.includes('outreach') || p.includes('pitch') || draftType === 'outreach') {
    return `${salutation}

I came across your work at [Company Name] and was impressed by your recent milestones. Our team specializes in high-performance web applications and automated AI workflows designed to accelerate business velocity and reduce operational overhead.

I would welcome the opportunity to share a quick 10-minute demonstration tailored specifically to your roadmap. Would you be open to connecting for a brief chat this Thursday at 2 PM?

${signOff}`;
  }

  // Clean prompt of meta-instructions
  const cleanPrompt = prompt
    .replace(/^(write a|draft an?|please write|compose an?)\s+[a-z\s-]+\s+(about|regarding|explaining|for|to)\s+/i, '')
    .trim();

  const contextNote = referenceContext
    ? `\n\nHaving reviewed the reference documentation provided, I have aligned all deliverables with the stated milestones.`
    : '';

  return `${salutation}

I am reaching out regarding ${cleanPrompt || 'our upcoming milestones'}.${contextNote}

To ensure complete alignment and clear execution, I have outlined our proposed direction:
• Direct review and confirmation of priority objectives.
• Implementation of proactive measures to ensure on-time delivery.
• Dedicated communication channels to keep all stakeholders aligned.

Please let me know if you would like any adjustments or if you would prefer to schedule a brief touchpoint.

${signOff}`;
}
