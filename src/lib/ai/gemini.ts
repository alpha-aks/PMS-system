import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY!);

export const gemini = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

// ─── Task complexity analysis ─────────────────────────────────────────────────
export interface StandupAnalysisResult {
  tasks: {
    title: string;
    cognitiveLoad: number;
    estimatedHours: number;
    revenueImpact: number;
    verifiabilityScore: number;
    complexityWeight: number;
    category: string;
    suggestions: string;
  }[];
  totalComplexityWeight: number;
  targetPercentage: number;
  aiSummary: string;
  projectedPayout: number;
  motivationalMessage: string;
}

const ROLE_CONTEXT: Record<string, string> = {
  ADMIN: 'Master Admin managing agency operations, finances, and team',
  DEV: 'Web Developer and Accounts manager handling code deployments and GST filings',
  TECH: 'Tech Lead and Lead Generation specialist managing sprints and CRM pipeline',
  DESIGN: 'Graphic Designer creating brand assets and marketing materials',
  VIDEO: 'Video Editor producing social media content and client deliverables',
  OPS: 'Operations specialist handling ad-hoc tasks and client coordination',
};

export async function analyzeStandup(
  rawTaskText: string,
  role: string,
  dailyRate: number
): Promise<StandupAnalysisResult> {
  const roleContext = ROLE_CONTEXT[role] || 'Agency team member';

  const prompt = `
You are the AI CEO for BrandBoosters Marketing Agency. Analyze the daily standup input from a ${roleContext}.

Team member's planned tasks for today:
"${rawTaskText}"

Their daily rate: ₹${dailyRate}

For each task, analyze and return a JSON object with this exact structure:
{
  "tasks": [
    {
      "title": "concise task title",
      "cognitiveLoad": <0-10, cognitive effort required>,
      "estimatedHours": <realistic hours>,
      "revenueImpact": <0-10, direct/indirect revenue contribution>,
      "verifiabilityScore": <0-10, how objectively verifiable the output is>,
      "complexityWeight": <calculated as: (cognitiveLoad*0.35 + normalizedTime*0.30 + revenueImpact*0.20 + verifiabilityScore*0.15)/10, where normalizedTime = min(hours/8,1)*10>,
      "category": "development|design|calling|sourcing|accounts|operations|creative",
      "suggestions": "specific tip to execute this task better"
    }
  ],
  "totalComplexityWeight": <sum of all complexity weights, max 1.0>,
  "targetPercentage": <percentage of daily target these tasks represent, 0-100>,
  "aiSummary": "2-3 sentence analysis of the day's workload",
  "projectedPayout": <calculated based on dailyRate and targetPercentage>,
  "motivationalMessage": "short, punchy motivational message tailored to their role"
}

Be precise with complexity scoring. A 3-hour deep development task should score 8-9 on cognitive load. A 50-call cold calling quota should score 6-7 on cognitive load but 8+ on revenue impact. Design work scores 7-8 on cognitive load with medium verifiability.
`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as StandupAnalysisResult;
  } catch (error) {
    console.error('Gemini standup analysis error:', error);
    throw new Error('Failed to analyze standup. Please try again.');
  }
}

// ─── Weekly content plan generation ──────────────────────────────────────────
export interface ContentPlanItem {
  userId: string;
  platform: 'INSTAGRAM' | 'LINKEDIN' | 'YOUTUBE';
  contentType: string;
  suggestion: string;
  dayOfWeek: string;
  estimatedTime: string;
  hook: string;
}

export async function generateWeeklyContentPlan(
  teamMembers: { id: string; name: string; role: string }[]
): Promise<ContentPlanItem[]> {
  const teamList = teamMembers
    .map(m => `- ${m.name} (${ROLE_CONTEXT[m.role] || m.role})`)
    .join('\n');

  const prompt = `
You are the Content Director for BrandBoosters Marketing Agency. Generate a personalized weekly content plan for the team to build their personal brands and market the agency.

Team members:
${teamList}

Generate a JSON array of content suggestions. Each suggestion:
{
  "userId": "<the team member's id from this list: ${JSON.stringify(teamMembers.map(m => ({ id: m.id, name: m.name })))}>",
  "platform": "INSTAGRAM|LINKEDIN|YOUTUBE",
  "contentType": "e.g. code_snippet|typography_breakdown|bts_reel|case_study|tutorial|behind_the_scenes|before_after|day_in_life",
  "suggestion": "specific, actionable content idea (2-3 sentences)",
  "dayOfWeek": "Monday|Tuesday|Wednesday|Thursday|Friday",
  "estimatedTime": "e.g. 30 mins|2 hours|1 hour",
  "hook": "attention-grabbing opening line for the post"
}

Rules:
- Dev/Accounts person: tech tips, GST insights, code snippets, developer lifestyle
- Tech/Lead Gen: growth hacking tips, outreach strategies, tool reviews
- Graphic Designer: design breakdowns, typography, color theory, before/after
- Video Editor: editing tips, trending formats, BTS of video production
- Operations: productivity hacks, agency life, quick wins

Generate 2-3 posts per person for the week. Make them highly specific and actionable.
Return ONLY the JSON array, no other text.
`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as ContentPlanItem[];
  } catch (error) {
    console.error('Gemini content plan error:', error);
    throw new Error('Failed to generate content plan.');
  }
}

// ─── Video creative toolkit ───────────────────────────────────────────────────
export interface VideoCreativePackage {
  moodBoard: {
    palette: string[];
    aesthetic: string;
    references: string[];
    lightingStyle: string;
    editingStyle: string;
  };
  shotList: {
    shot: number;
    type: string;
    description: string;
    duration: string;
    notes: string;
  }[];
  audioSuggestions: {
    genre: string;
    mood: string;
    bpm: string;
    searchTerms: string[];
    platforms: string[];
  }[];
  hookIdeas: string[];
  pacingNotes: string;
  captionTemplate: string;
}

export async function generateVideoCreativePackage(
  brief: string,
  targetAudience: string
): Promise<VideoCreativePackage> {
  const prompt = `
You are a professional video director helping Om (video editor at BrandBoosters Marketing Agency) execute a video project.

Video Brief: "${brief}"
Target Audience: "${targetAudience}"

Generate a comprehensive creative package as JSON:
{
  "moodBoard": {
    "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
    "aesthetic": "e.g. 'Dark corporate with neon accents'",
    "references": ["reference style 1", "reference style 2"],
    "lightingStyle": "e.g. 'Side-lit with warm practical lights'",
    "editingStyle": "e.g. 'Fast-paced cuts synced to beat drops'"
  },
  "shotList": [
    {
      "shot": 1,
      "type": "e.g. Wide Shot|Close-up|Medium Shot|B-Roll|Text Overlay",
      "description": "detailed shot description",
      "duration": "e.g. 3-5 seconds",
      "notes": "technical or creative notes"
    }
  ],
  "audioSuggestions": [
    {
      "genre": "e.g. Lo-fi Hip Hop",
      "mood": "e.g. energetic and confident",
      "bpm": "e.g. 120-140 BPM",
      "searchTerms": ["term1", "term2"],
      "platforms": ["YouTube Audio Library", "Epidemic Sound", "Artlist"]
    }
  ],
  "hookIdeas": ["hook idea 1", "hook idea 2", "hook idea 3"],
  "pacingNotes": "detailed pacing and rhythm guidance",
  "captionTemplate": "complete caption template with placeholder text"
}
`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as VideoCreativePackage;
  } catch (error) {
    console.error('Gemini video creative error:', error);
    throw new Error('Failed to generate creative package.');
  }
}
