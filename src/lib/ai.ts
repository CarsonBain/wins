import OpenAI from "openai";
import { format } from "date-fns";
import type { Store, WinEntry, PrEntry } from "../types.js";

const MODEL = "anthropic/claude-sonnet-4-6";

function filterByDate<T extends { timestamp?: string; mergedAt?: string }>(
  items: T[],
  since?: string,
  until?: string
): T[] {
  return items.filter((item) => {
    const dateStr = (item as WinEntry).timestamp ?? (item as PrEntry).mergedAt;
    if (!dateStr) return true;
    const date = new Date(dateStr);
    if (since && date < new Date(since)) return false;
    if (until && date > new Date(until)) return false;
    return true;
  });
}

export function buildContext(store: Store, since?: string, until?: string): string {
  const wins = filterByDate(store.wins, since, until);
  const prs = filterByDate(store.prs, since, until);

  const lines: string[] = [];

  if (wins.length > 0) {
    lines.push("## Manual Win Entries");
    for (const w of wins) {
      const date = format(new Date(w.timestamp), "yyyy-MM-dd");
      const tags = w.tags.length > 0 ? ` [${w.tags.join(", ")}]` : "";
      lines.push(`- [${date}]${tags} ${w.content}`);
    }
    lines.push("");
  }

  if (prs.length > 0) {
    lines.push("## Merged Pull Requests");
    for (const pr of prs) {
      const date = format(new Date(pr.mergedAt), "yyyy-MM-dd");
      const labels = pr.labels.length > 0 ? ` [${pr.labels.join(", ")}]` : "";
      lines.push(
        `- [${date}] ${pr.repo}#${pr.number}: ${pr.title}${labels}`
      );
      lines.push(
        `  Stats: +${pr.additions}/-${pr.deletions}, ${pr.changedFiles} files changed`
      );
      if (pr.body && pr.body.trim()) {
        const truncated = pr.body.trim().slice(0, 300);
        lines.push(`  Description: ${truncated}${pr.body.length > 300 ? "..." : ""}`);
      }
    }
  }

  if (lines.length === 0) {
    return "No wins or PRs recorded in the specified time range.";
  }

  return lines.join("\n");
}

export async function generateAiResponse(
  apiKey: string,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    stream: true,
  });

  let result = "";
  for await (const chunk of stream) {
    result += chunk.choices[0]?.delta?.content ?? "";
  }
  return result;
}

export const PROMPTS = {
  summary: `You are helping an engineer reflect on their work. Given these wins and merged pull requests, write a concise 3–5 sentence summary of their key accomplishments. Focus on impact, scope, and what they shipped or improved. Be specific and concrete. Do not open with a preamble sentence — lead directly with the substance.`,

  themes: `You are helping an engineer reflect on their work. Identify 4–6 recurring themes or focus areas from these accomplishments. For each theme, provide a short title and list 2–3 supporting examples from the data. Format as a clear, scannable list.`,

  reviewStar: `You are helping an engineer articulate their work impact. Write 3–5 examples in STAR format (Situation, Task, Action, Result) highlighting their most impactful work. Focus on measurable outcomes, scale, and collaboration signals visible in the data. This can be used for performance reviews, career conversations, or personal reflection.`,

  reviewBullet: `You are helping an engineer articulate their work impact. Summarise their accomplishments as bullet points, organised by theme or impact area. Each bullet should be specific and achievement-oriented, highlighting impact, scale, or collaboration. Write 8–12 bullets. This can be used for performance reviews, career conversations, or personal reflection.`,

  reviewProse: `You are helping an engineer articulate their work impact. Write a 3–5 paragraph narrative summarising their overall trajectory, key achievements, impact, and collaboration. Write in third person. This can be used for performance reviews, career conversations, or personal reflection.`,
};
