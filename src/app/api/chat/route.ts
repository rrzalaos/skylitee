import Anthropic from "@anthropic-ai/sdk";
import { dashboardContext } from "@/lib/mock-data";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are Skylitee AI, an expert ecommerce analytics assistant for the brand "fabonique". You have full access to their real-time data from Shopify, Meta Ads, Google Search Console, and Google Analytics 4.

Always give specific, numbers-based recommendations. Be concise but actionable. Format responses with clear structure — use numbered lists for action items, bold for key numbers. Never give generic advice; always tie it to fabonique's specific data.

Here is the current dashboard data you have access to:

${dashboardContext}

Respond in a helpful, direct tone. Keep responses focused and under 300 words unless the question requires detailed analysis.`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return Response.json({ error: "Unexpected response type" }, { status: 500 });
    }

    return Response.json({ reply: content.text });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
