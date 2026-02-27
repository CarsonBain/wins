import { Command } from "commander";
import chalk from "chalk";
import { nanoid } from "nanoid";
import { loadConfig, loadStore, saveStore } from "../lib/store.js";
import type { WinEntry } from "../types.js";

export function registerLog(program: Command): void {
  program
    .command("log <message>")
    .description("Append a timestamped win to the store")
    .option("--tag <tags>", "Comma-separated tags")
    .option("--date <date>", "Override date (YYYY-MM-DD or ISO 8601), for retroactive entries")
    .action((message: string, options: { tag?: string; date?: string }) => {
      const config = loadConfig();
      const store = loadStore(config);

      const tags = options.tag
        ? options.tag.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      let timestamp: string;
      if (options.date) {
        const parsed = new Date(options.date);
        if (isNaN(parsed.getTime())) {
          console.error(`Invalid date: ${options.date}`);
          process.exit(1);
        }
        timestamp = parsed.toISOString();
      } else {
        timestamp = new Date().toISOString();
      }

      const entry: WinEntry = {
        id: nanoid(),
        timestamp,
        content: message,
        tags,
      };

      store.wins.push(entry);
      saveStore(config, store);

      const tagStr = tags.length > 0 ? chalk.dim(` [${tags.join(", ")}]`) : "";
      console.log(chalk.green("✓") + " Win logged:" + tagStr);
      console.log(chalk.white(`  ${message}`));
    });
}
