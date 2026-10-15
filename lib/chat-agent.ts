import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { estimateTokens } from './optimizer';
import { resolveClaudeModel } from './pricing';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatParams {
  messages: ChatMessage[];
  currentDraftContent?: string;
  currentSubject?: string;
  model?: string;
  apiKey?: string;
}

interface ChatResult {
  reply: string;
  subjectLine?: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

export async function runAIChat(params: ChatParams): Promise<ChatResult> {
  const {
    messages,
    currentDraftContent = '',
    currentSubject = '',
    model = 'claude-sonnet-4-5-20250929',
    apiKey,
  } = params;

  const anthropicKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';

  const lastUserMessage = messages[messages.length - 1]?.content || '';

  const systemPrompt = `You are "DraftCraft Copilot", an elite AI executive writing assistant and drafting engine.

MANDATORY RULES & STRICT BEHAVIOR:
1. NEVER ASK CLARIFYING QUESTIONS OR QUESTIONNAIRES.
   - NEVER reply with "To help you draft this, please tell me...", "Could you clarify...", or a numbered list of questions asking for tone, notice period, reasons, or details.
   - NEVER ask the user for suggestions or more information before writing.
   - NEVER delay, withhold, or refuse drafting.
   - If ANY details (dates, names, company, notice period, specific reasons) are unspecified by the user, immediately make standard professional assumptions and use clean bracketed placeholders: [Manager's Name], [Company Name], [Last Working Day – e.g. two weeks notice], [Reason - Optional], [Your Name], [Your Title].

2. EXACT FORMAT FOR ALL DRAFTS AND WRITING REQUESTS:
   Whenever the user asks to write, draft, develop, generate, or compose any letter, email, or message (e.g., resignation, leave request, follow-up, apology, proposal, introduction):
   - You MUST immediately output the COMPLETE, finalized document ready for direct use.
   - Line 1 MUST be the subject line starting with "Subject: " (e.g., "Subject: Notice of Resignation – [Your Name]"). Do NOT put bold asterisks around "Subject:".
   - Follow with a blank line.
   - Follow with the formal salutation (e.g., "Dear [Manager's Name],").
   - Follow with complete, polished, well-spaced paragraphs (clear statement of purpose, details/gratitude/handover support, next steps).
   - Follow with a formal sign-off (e.g., "Sincerely," or "Best regards,").
   - Follow with placeholder signature lines (e.g., "[Your Name]\n[Your Contact Information]").
   - ZERO conversational preamble or chit-chat. Do NOT say "Here is your resignation letter:" or "Certainly!". Start directly with "Subject: ".

3. WHEN USER EXPLICITLY ASKS FOR FEEDBACK OR STRATEGIC ADVICE:
   (Only if the user explicitly asks "critique my draft", "suggest 3 subject lines", or "what should I change?"):
   - Provide direct, concise bullet points answering their exact question immediately.
   - Do NOT ask questions back.

4. GREETINGS:
   If the user only says a greeting ("hi", "hello"):
   - Greet them warmly in one sentence and ask what email or letter they need drafted.

${currentDraftContent ? `CURRENT STUDIO DRAFT (Context for reference/editing):\nSubject: ${currentSubject || '(Untitled)'}\n"""\n${currentDraftContent}\n"""\n(Note: If the user's latest prompt requests a new or different type of letter, draft the NEW letter immediately.)` : ''}`;

  // 1. Anthropic Claude API Call
  if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
    try {
      const activeModel = resolveClaudeModel(model);
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      // Clean and sanitize messages for Anthropic API:
      // 1. Remove empty messages
      // 2. Ensure history begins with a user message (Anthropic API requirement)
      let rawMsgs = messages.filter((m) => m && m.content && m.content.trim().length > 0);
      while (rawMsgs.length > 0 && rawMsgs[0].role === 'assistant') {
        rawMsgs = rawMsgs.slice(1);
      }

      if (rawMsgs.length === 0) {
        rawMsgs = [{ role: 'user', content: lastUserMessage || 'Please draft the requested letter.' }];
      }

      // 3. Ensure strictly alternating roles (user -> assistant -> user)
      const formattedMessages: { role: 'user' | 'assistant'; content: string }[] = [];
      for (const m of rawMsgs) {
        const role = m.role === 'user' ? ('user' as const) : ('assistant' as const);
        if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === role) {
          formattedMessages[formattedMessages.length - 1].content += '\n\n' + m.content;
        } else {
          formattedMessages.push({ role, content: m.content });
        }
      }

      const response = await anthropic.messages.create({
        model: activeModel,
        max_tokens: 1500,
        temperature: 0.5,
        system: systemPrompt,
        messages: formattedMessages,
      });

      const firstBlock = response.content[0];
      const text = firstBlock.type === 'text' ? firstBlock.text : '';

      let subjectLine = '';
      const subjectMatch = text.match(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*\*{0,2}(.*?)\*{0,2}$/im);
      if (subjectMatch) {
        subjectLine = subjectMatch[1].replace(/^\*+|\*+$/g, '').trim();
      }

      return {
        reply: text,
        subjectLine,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        modelUsed: activeModel,
      };
    } catch (err: unknown) {
      console.error('Claude Chat API error:', err);
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

      const result = await geminiModel.generateContent(lastUserMessage);
      const text = result.response.text();

      let subjectLine = '';
      const subjectMatch = text.match(/^(?:\*\*|#+\s*)?Subject(?:\s*Line)?:\s*\*{0,2}(.*?)\*{0,2}$/im);
      if (subjectMatch) {
        subjectLine = subjectMatch[1].replace(/^\*+|\*+$/g, '').trim();
      }

      return {
        reply: text,
        subjectLine,
        inputTokens: estimateTokens(systemPrompt + lastUserMessage),
        outputTokens: estimateTokens(text),
        modelUsed: 'gemini-1.5-flash',
      };
    } catch (err) {
      console.error('Gemini Chat API error:', err);
    }
  }

  // 3. Intelligent Sandbox Simulation (Directly answers what was asked)
  const simulation = simulateCopilotResponse(lastUserMessage, currentDraftContent, currentSubject);

  return {
    reply: simulation.reply,
    subjectLine: simulation.subjectLine,
    inputTokens: estimateTokens(systemPrompt + lastUserMessage),
    outputTokens: estimateTokens(simulation.reply),
    modelUsed: `${model} (Sandbox)`,
  };
}

/**
 * Intelligent simulation engine that gives exact, precise answers
 */
function simulateCopilotResponse(
  prompt: string,
  currentDraft?: string,
  currentSubject?: string
): { reply: string; subjectLine?: string } {
  const p = prompt.trim().toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|good morning|good afternoon|greetings)[\s!.]*$/i.test(p)) {
    return {
      reply: "Hello! I am your DraftCraft Copilot. Tell me what email or letter you would like to write, optimize, or brainstorm, and I'll create it directly for you.",
    };
  }

  // Follow-up email request (e.g. 2-paragraph follow-up to client who hasn't replied)
  if (p.includes('follow') || p.includes('prospective client') || p.includes('replied')) {
    const subject = "Following up on our recent discussion";
    const body = `Subject: ${subject}

Hi [Client Name],

I hope you're having a productive week. I'm following up on my previous note regarding our proposed collaboration on [Project/Service Name]. I wanted to ensure you had all the information needed and see if you had any preliminary questions on the scope or timeline.

We have availability in our schedule starting next month, and I'd welcome a brief 10-minute check-in this Thursday or Friday if convenient for you. Otherwise, please feel free to review the details at your leisure.

Best regards,

[Your Name]
[Your Title]
[Your Company]`;
    return { reply: body, subjectLine: subject };
  }

  // Subject line suggestions
  if (p.includes('subject line') || p.includes('suggest subject')) {
    return {
      reply: `Here are 3 high-converting subject line options tailored for maximum open rates:

1. **"Quick follow-up regarding [Project Name] – next steps"** (Direct & professional)
2. **"Checking in on [Topic] (10-min sync this week?)"** (Low friction, action-oriented)
3. **"Thought you'd find this helpful + update on our proposal"** (Value-first approach)`,
    };
  }

  // Critique or optimize request
  if (p.includes('critique') || p.includes('optimize') || p.includes('review')) {
    if (currentDraft && currentDraft.length > 20) {
      return {
        reply: `Here is a targeted critique of your current draft:

1. **Clarity & Opening**: The introduction is clear, but consider personalizing the greeting directly to the recipient's role.
2. **Brevity & Fluff Reduction**: Condense the middle paragraph into 2 concise bullet points to improve readability on mobile devices.
3. **Call-to-Action (CTA)**: Replace open-ended phrasing with a specific date and time proposal (e.g., "Thursday at 2 PM").

Would you like me to rewrite it with these 3 improvements applied?`,
      };
    }
    return {
      reply: "Please paste your draft or enter talking points in the Studio canvas, and I'll provide a full critique on tone, clarity, and token optimization.",
    };
  }

  // Resignation letter request
  if (p.includes('resign') || p.includes('resignation')) {
    const subject = "Notice of Resignation – [Your Name]";
    const body = `Subject: ${subject}

Dear [Manager's Name],

Please accept this letter as formal notification that I am resigning from my position as [Your Job Title] at [Company Name]. My last day of employment will be [Last Working Day – e.g. two weeks from today's date].

I would like to express my sincere appreciation for the opportunities I've had during my time with [Company Name]. I have truly enjoyed working with you and the team, and I am grateful for your support and guidance throughout my tenure.

During my remaining time, I will do everything possible to complete my ongoing projects and ensure a seamless handover of my responsibilities to the team. Please let me know how I can best assist with the transition.

I wish you, the team, and the organization continued success in the future.

Sincerely,

[Your Name]
[Your Phone Number]
[Your Email Address]`;
    return { reply: body, subjectLine: subject };
  }

  // Leave / Permission request
  if (p.includes('leave') || p.includes('permission') || p.includes('time off')) {
    const subject = "Request for Leave Approval – [Your Name]";
    const body = `Subject: ${subject}

Dear [Manager's Name],

I am writing to formally request leave from [Start Date] to [End Date], resuming my regular duties on [Return Date]. The reason for my leave is [brief reason, e.g. personal commitments / medical appointment / family obligation].

Prior to my departure, I will ensure that all my priority deliverables are completed, and I will brief [Colleague's Name] to oversee any urgent operational matters. I will remain reachable via email for any emergencies.

Thank you in advance for your consideration and understanding.

Warm regards,

[Your Name]
[Your Title]`;
    return { reply: body, subjectLine: subject };
  }

  // Executive tone request
  if (p.includes('executive') || p.includes('authoritative')) {
    const subject = currentSubject || "Strategic Update & Proposed Direction";
    const body = `Subject: ${subject}

Dear [Recipient Name],

I am writing to provide an executive overview regarding our strategic roadmap for [Initiative Name]. Our primary objective is to drive operational efficiency and achieve key delivery milestones on schedule.

Key Priorities:
• Immediate stabilization of core deliverables to mitigate risks.
• Allocation of dedicated engineering bandwidth to accelerate completion.
• Bi-weekly governance updates to ensure stakeholder alignment.

I look forward to discussing our immediate next steps during our upcoming briefing.

Sincerely,

[Your Name]
[Your Title]`;
    return { reply: body, subjectLine: subject };
  }

  // General drafting request
  const subject = `Regarding: ${prompt.slice(0, 35).trim()}`;
  const body = `Subject: ${subject}

Dear [Recipient Name],

I am writing regarding ${prompt.trim()}.

I wanted to ensure complete alignment and confirm the next steps to move this forward effectively. Please let me know your thoughts or if you need any additional clarification.

Best regards,

[Your Name]
[Your Title]`;

  return { reply: body, subjectLine: subject };
}
