import chalk from "chalk";

const TERM_WIDTH = Math.min(process.stdout.columns ?? 80, 88);

function wordWrap(text: string, indent = 0): string {
  const maxWidth = TERM_WIDTH - indent;
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxWidth) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const pad = " ".repeat(indent);
  return lines.map((l, i) => (i === 0 ? l : pad + l)).join("\n");
}

function applyInline(text: string): string {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, (_, t) => chalk.bold(t));
  // Italic: *text* or _text_  (only single, not double)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, (_, t) => chalk.italic(t));
  return text;
}

export function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1
    if (/^# /.test(line)) {
      const text = line.slice(2).trim();
      out.push("");
      out.push(chalk.bold.cyan(text));
      out.push(chalk.cyan("─".repeat(Math.min(text.length + 2, TERM_WIDTH))));
      continue;
    }

    // H2
    if (/^## /.test(line)) {
      const text = line.slice(3).trim();
      out.push("");
      out.push(chalk.bold.white(text));
      out.push(chalk.dim("─".repeat(Math.min(text.length + 2, TERM_WIDTH))));
      continue;
    }

    // H3
    if (/^### /.test(line)) {
      out.push("");
      out.push(chalk.bold(line.slice(4).trim()));
      continue;
    }

    // Bullet: - or *
    if (/^(\s*)[-*] /.test(line)) {
      const match = line.match(/^(\s*)[-*] (.*)/);
      if (match) {
        const indent = match[1].length;
        const bullet = indent > 0 ? chalk.dim("◦") : chalk.cyan("•");
        const content = applyInline(match[2]);
        const wrapped = wordWrap(content, indent + 3);
        out.push(" ".repeat(indent) + bullet + " " + wrapped);
        continue;
      }
    }

    // Numbered list: 1. 2. etc.
    if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. (.*)/);
      if (match) {
        const num = chalk.cyan(match[1] + ".");
        const content = applyInline(match[2]);
        const wrapped = wordWrap(content, match[1].length + 2);
        out.push(num + " " + wrapped);
        continue;
      }
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      out.push(chalk.dim("─".repeat(TERM_WIDTH)));
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      out.push("");
      continue;
    }

    // Regular paragraph text
    out.push(wordWrap(applyInline(line), 0));
  }

  // Trim leading/trailing blank lines
  while (out.length > 0 && out[0] === "") out.shift();
  while (out.length > 0 && out[out.length - 1] === "") out.pop();

  return out.join("\n");
}
