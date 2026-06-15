import { z } from 'zod';
import { gemini } from './gemini';

export const contentItemSchema = z.object({
  userId: z.string().describe('The ID of the user this content is generated for.'),
  platform: z.enum(['INSTAGRAM', 'LINKEDIN', 'YOUTUBE']).describe('The platform best suited for this content.'),
  contentType: z.string().describe('The type or format of content (e.g., "Reel", "Carousel", "Behind the Scenes", "Tutorial").'),
  suggestion: z.string().describe('A detailed, actionable idea for the content.'),
  caption: z.string().describe('A draft caption for the content, including suggested hashtags.'),
});

export const weeklyContentPlanSchema = z.object({
  contentItems: z.array(contentItemSchema).describe('The list of generated content items for the team.'),
});

export type WeeklyContentPlan = z.infer<typeof weeklyContentPlanSchema>;

export async function generateWeeklyContentPlan(
  teamMembers: Array<{ id: string; name: string; role: string }>
): Promise<WeeklyContentPlan> {
  const teamContext = teamMembers
    .map((member) => `- ${member.name} (Role: ${member.role}, ID: ${member.id})`)
    .join('\n');

  const prompt = `
You are the AI Chief Marketing Officer for BrandBoosters Marketing Agency.
Your task is to generate a weekly social media content plan for the active team members.

Current Active Team Members:
${teamContext}

Rules:
1. Generate exactly 2 high-quality content ideas for EACH active team member.
2. Tailor the content strictly to their role (e.g., VIDEO editors should get video/reel ideas, DESIGNERS should get graphic/carousel ideas, DEV/TECH should get technical snippets or behind-the-scenes building).
3. Assign the correct 'userId' from the list above to each generated idea.
4. Ensure the ideas are engaging, actionable, and ready for production.
5. Provide a draft caption for each idea.
`;

  const fullPrompt = prompt + `\n\nReturn EXACTLY a JSON object with this structure, and absolutely nothing else:
{
  "contentItems": [
    {
      "userId": "<string>",
      "platform": "INSTAGRAM" | "LINKEDIN" | "YOUTUBE",
      "contentType": "<string>",
      "suggestion": "<string>",
      "caption": "<string>"
    }
  ]
}`;

  try {
    console.log('Calling gemini.generateContent...');
    const result = await gemini.generateContent(fullPrompt);
    const text = result.response.text();
    console.log('gemini.generateContent completed successfully.');

    return JSON.parse(text) as WeeklyContentPlan;
  } catch (error) {
    console.error('Vercel AI SDK content plan generation error:', error);
    throw new Error('Failed to generate content plan with AI.');
  }
}
