import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { estimateTokens } from './optimizer';
import { resolveClaudeModel } from './pricing';

export interface RefineParams {
  currentContent: string;
  currentSubject?: string;
  action: 'shorten' | 'executive' | 'friendly' | 'add-cta' | 're-tone';
  targetPreset?: string;
  model?: string;
  apiKey?: string;
}

export interface RefineResult {
  content: string;
  subjectLine?: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

/**
 * Dedicated Refinement & Tone Adjustment Engine
 */
export async function runAIRefine(params: RefineParams): Promise<RefineResult> {
  const {
    currentContent,
    currentSubject = '',
    action,
    targetPreset = 'formal',
    model = 'claude-haiku-4-5-20251001',
    apiKey,
  } = params;

  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';

  // Separate any accidental "Subject: ..." prefix from input content
  let bodyToRefine = currentContent.trim();
  let existingSubject = currentSubject.trim();

  const leadingSubjectMatch = bodyToRefine.match(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*\*{0,2}(.*?)\*{0,2}(?:\n+|$)/im);
  if (leadingSubjectMatch) {
    if (!existingSubject) {
      existingSubject = leadingSubjectMatch[1].replace(/^\*+|\*+$/g, '').trim();
    }
    bodyToRefine = bodyToRefine.replace(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*.*(?:\n+|$)/im, '').trim();
  }

  const actionInstructions: Record<string, string> = {
    shorten: 'Eliminate fluff, unnecessary filler words, and redundancies. Tighten sentences so the draft is concise, crisp, and high-impact while preserving all key facts, dates, commitments, and placeholders.',
    executive: 'Elevate vocabulary, syntax, and tone to sound authoritative, C-suite caliber, highly polished, strategic, and decisive while keeping the core message and placeholders intact.',
    friendly: 'Soften the tone to sound warm, empathetic, collaborative, appreciative, and approachable while maintaining professional credibility and preserving all facts.',
    'add-cta': 'Strengthen the closing of the text with a decisive call-to-action (CTA) and clear next steps, ensuring the recipient knows exactly what to do next.',
    're-tone': `Re-tone the following text to match a ${targetPreset} tone while preserving all facts.`,
  };

  const currentInstruction = actionInstructions[action] || actionInstructions.shorten;

  const systemPrompt = `You are an expert AI Executive Editor and Communications Polisher.
Your job is to directly refine and polish the user's existing draft according to the requested directive.

DIRECTIVE:
${currentInstruction}

MANDATORY FORMATTING RULES:
1. Output ONLY the refined draft text.
2. If the original text includes a greeting/salutation (e.g. "Dear [Name],"), preserve or adapt an appropriate salutation.
3. If the original text includes a sign-off (e.g. "Sincerely, [Name]"), preserve or adapt the sign-off.
4. Keep all bracketed placeholders (e.g. [Company Name], [Date], [Your Name]) intact.
5. NEVER output conversational preamble like "Here is your shortened draft:". Output ONLY the clean polished draft.
6. Do NOT prefix the output with "Subject: " or include a subject line in the body. Output only the message body.`;

  const userPrompt = existingSubject
    ? `Document Subject: ${existingSubject}\n\nDraft Content to Refine:\n"""\n${bodyToRefine}\n"""`
    : `Draft Content to Refine:\n"""\n${bodyToRefine}\n"""`;

  // 1. Anthropic Claude API Call
  if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
    try {
      const activeModel = resolveClaudeModel(model);
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      const response = await anthropic.messages.create({
        model: activeModel,
        max_tokens: 1500,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const firstBlock = response.content[0];
      let refinedText = firstBlock.type === 'text' ? firstBlock.text.trim() : '';

      // Clean out any accidental subject line emitted by Claude
      let refinedSubject = existingSubject;
      const match = refinedText.match(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*\*{0,2}(.*?)\*{0,2}(?:\n+|$)/im);
      if (match) {
        if (!refinedSubject) {
          refinedSubject = match[1].replace(/^\*+|\*+$/g, '').trim();
        }
        refinedText = refinedText.replace(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*.*(?:\n+|$)/im, '').trim();
      }

      return {
        content: refinedText,
        subjectLine: refinedSubject,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        modelUsed: activeModel,
      };
    } catch (err: unknown) {
      console.error('Claude Refine API error:', err);
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
        throw new Error('System is currently offline: Unable to reach Claude AI (Connection timed out). Please check your internet connection.');
      }
      throw new Error(`Claude AI error: ${msg}`);
    }
  }

  // 2. Google Gemini API Call
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      });

      const result = await geminiModel.generateContent(userPrompt);
      let text = result.response.text().trim();

      let refinedSubject = existingSubject;
      const match = text.match(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*\*{0,2}(.*?)\*{0,2}(?:\n+|$)/im);
      if (match) {
        if (!refinedSubject) refinedSubject = match[1].replace(/^\*+|\*+$/g, '').trim();
        text = text.replace(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*.*(?:\n+|$)/im, '').trim();
      }

      return {
        content: text,
        subjectLine: refinedSubject,
        inputTokens: estimateTokens(systemPrompt + userPrompt),
        outputTokens: estimateTokens(text),
        modelUsed: 'gemini-1.5-flash',
      };
    } catch (err) {
      console.error('Gemini Refine API error:', err);
    }
  }

  // 3. Intelligent Sandbox Simulation Fallback
  const simulated = simulateRefinement(bodyToRefine, action, existingSubject);
  return {
    content: simulated,
    subjectLine: existingSubject,
    inputTokens: estimateTokens(systemPrompt + userPrompt),
    outputTokens: estimateTokens(simulated),
    modelUsed: `${model} (Sandbox)`,
  };
}

/**
 * Intelligent local fallback for offline/sandbox mode
 */
function simulateRefinement(content: string, action: string, subject?: string): string {
  const lines = content.split('\n');
  const greeting = lines[0] && lines[0].toLowerCase().startsWith('dear') ? lines[0] : '';
  const bodyLines = greeting ? lines.slice(1).join('\n').trim() : content;

  if (action === 'shorten') {
    const condensed = bodyLines
      .replace(/I am writing to (formally )?/gi, '')
      .replace(/would like to /gi, '')
      .replace(/in order to /gi, 'to ')
      .replace(/due to the fact that /gi, 'because ')
      .replace(/at this point in time/gi, 'currently')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return greeting ? `${greeting}\n\n${condensed}` : condensed;
  }

  if (action === 'executive') {
    return greeting
      ? `${greeting}\n\nI am providing an executive update regarding our current operational milestones.\n\n${bodyLines}\n\nWe remain decisively committed to executing on schedule.`
      : `Executive Briefing:\n\n${bodyLines}\n\nWe remain decisively committed to operational excellence.`;
  }

  if (action === 'friendly') {
    const warmGreeting = greeting.replace(/^Dear\b/i, 'Hi');
    return `${warmGreeting || 'Hi team,'}\n\nI hope you are having a wonderful week! 😊\n\n${bodyLines}\n\nWarm regards,\n[Your Name]`;
  }

  if (action === 'add-cta') {
    return `${content}\n\n**Next Steps:**\nPlease confirm your availability by Thursday at 2:00 PM so we can align our timeline and finalize deliverables promptly.`;
  }

  return content;
}
