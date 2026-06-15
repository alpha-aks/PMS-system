import { gemini } from './gemini';
import { z } from 'zod';

export const standupResultSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe('Concise task title'),
      cognitiveLoad: z.number().min(0).max(10).describe('Cognitive effort required (0-10)'),
      estimatedHours: z.number().describe('Realistic hours to complete'),
      revenueImpact: z.number().min(0).max(10).describe('Direct/indirect revenue contribution (0-10)'),
      verifiabilityScore: z.number().min(0).max(10).describe('How objectively verifiable the output is (0-10)'),
      complexityWeight: z.number().describe('Calculated as: (cognitiveLoad*0.35 + normalizedTime*0.30 + revenueImpact*0.20 + verifiabilityScore*0.15)/10'),
      category: z.enum(['development', 'design', 'calling', 'sourcing', 'accounts', 'operations', 'creative']),
      clientProjectMapping: z.string().nullable().describe('The name of the Client Project this task contributes to, or null if internal/unrelated.'),
      suggestions: z.string().describe('Specific tip to execute this task better'),
    })
  ),
  totalComplexityWeight: z.number().describe('Sum of all complexity weights, max 1.0'),
  targetPercentage: z.number().min(0).max(100).describe('Percentage of daily target these tasks represent (0-100)'),
  aiSummary: z.string().describe('2-3 sentence analysis of the day\'s workload'),
  projectedPayout: z.number().describe('Calculated based on (monthlySalary / 30) * (targetPercentage / 100)'),
  motivationalMessage: z.string().describe('Short, punchy motivational message tailored to their role'),
});

export type StandupAnalysisResult = z.infer<typeof standupResultSchema>;

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
  monthlySalary: number,
  assignedProjects: { name: string; description: string | null }[]
): Promise<StandupAnalysisResult> {
  const roleContext = ROLE_CONTEXT[role] || 'Agency team member';

  const prompt = `
You are the AI CEO for BrandBoosters Marketing Agency. Analyze the daily standup input from a ${roleContext}.

Team member's planned tasks for today:
"${rawTaskText}"

Their monthly salary: ₹${monthlySalary}

Currently Assigned Client Projects:
${assignedProjects.length > 0 ? assignedProjects.map(p => `- ${p.name}: ${p.description || 'No description'}`).join('\n') : 'No active client projects assigned. Evaluate solely on internal work.'}

Be precise with complexity scoring. 
- A 3-hour deep development task should score 8-9 on cognitive load. 
- A 50-call cold calling quota should score 6-7 on cognitive load but 8+ on revenue impact. 
- Design work scores 7-8 on cognitive load with medium verifiability.

CRITICAL CLIENT WORK EVALUATION:
Your calculated \`targetPercentage\` must strongly reflect how much of their daily capacity is spent driving their Assigned Client Projects forward. If they are working heavily on assigned client projects, their targetPercentage should be high (80-100%). If they are only doing internal busywork, grade them strictly.

Calculate complexityWeight for each task as:
(cognitiveLoad * 0.35 + min(estimatedHours/8, 1) * 10 * 0.30 + revenueImpact * 0.20 + verifiabilityScore * 0.15) / 10

ProjectedPayout should be calculated based on (monthlySalary / 30) * (targetPercentage / 100).

Return EXACTLY a JSON object with the following structure and absolutely nothing else:
{
  "tasks": [
    {
      "title": "<string>",
      "cognitiveLoad": <number 0-10>,
      "estimatedHours": <number>,
      "revenueImpact": <number 0-10>,
      "verifiabilityScore": <number 0-10>,
      "complexityWeight": <number>,
      "category": "development" | "design" | "calling" | "sourcing" | "accounts" | "operations" | "creative",
      "clientProjectMapping": "<string | null>",
      "suggestions": "<string>"
    }
  ],
  "totalComplexityWeight": <number>,
  "targetPercentage": <number 0-100>,
  "aiSummary": "<string>",
  "projectedPayout": <number>,
  "motivationalMessage": "<string>"
}
`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as StandupAnalysisResult;
  } catch (error) {
    console.error('Gemini SDK standup analysis error:', error);
    throw new Error('Failed to analyze standup with Gemini SDK. Please try again.');
  }
}
