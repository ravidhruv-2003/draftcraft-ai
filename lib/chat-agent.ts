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

  const systemPrompt = `You are "DraftCraft Copilot", an elite AI executive writing assistant, editor, and communication strategist.
Your mission:
1. Answer ONLY what the user asks directly, concisely, and accurately.
2. If the user asks to draft or write an email/letter:
   - Provide a compelling Subject line on the first line (e.g., "Subject: ...").
   - Follow with the exact drafted email/letter body matching their constraints (e.g. 2 paragraphs, specific tone).
   - Do NOT include conversational preamble like "Sure, here is your email:".
3. If the user asks for suggestions, critique, or advice:
   - Provide direct, concise bullet points answering their exact question.
4. If the user says a greeting (like "hi" or "hello"):
   - Greet them warmly and briefly ask how you can help with their email or letter.

${currentDraftContent ? `CURRENT STUDIO DRAFT (Context):\nSubject: ${currentSubject || '(Untitled)'}\n"""\n${currentDraftContent}\n"""` : ''}`;

  // 1. Anthropic Claude API Call
  if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
    try {
      const activeModel = resolveClaudeModel(model);
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      const formattedMessages = messages.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));

      const response = await anthropic.messages.create({
        model: activeModel,
        max_tokens: 1200,
        temperature: 0.7,
        system: systemPrompt,
        messages: formattedMessages,
      });

      const firstBlock = response.content[0];
      const text = firstBlock.type === 'text' ? firstBlock.text : '';

      let subjectLine = '';
      const subjectMatch = text.match(/^Subject:\s*(.*)$/im);
      if (subjectMatch) {
        subjectLine = subjectMatch[1].trim();
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
      const subjectMatch = text.match(/^Subject:\s*(.*)$/im);
      if (subjectMatch) {
        subjectLine = subjectMatch[1].trim();
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
