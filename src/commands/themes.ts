import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig, loadStore } from "../lib/store.js";
import { buildContext, generateAiResponse, PROMPTS } from "../lib/ai.js";
import { renderMarkdown } from "../lib/format.js";

export function registerThemes(program: Command): void {
  program
    .command("themes")
    .description("AI: identify 4–6 recurring themes with examples")
    .option("--since <date>", "Filter from date (YYYY-MM-DD)")
    .option("--until <date>", "Filter until date (YYYY-MM-DD)")
    .action(async (options: { since?: string; until?: string }) => {
      const config = loadConfig();

      if (!config.openrouterApiKey) {
        console.error(
          chalk.red("OpenRouter API key not configured. Run: wins config set openrouterApiKey <key>")
        );
        process.exit(1);
      }

      const store = loadStore(config);
      const context = buildContext(store, options.since, options.until);

      const spinner = ora("Identifying themes…").start();

      try {
        const response = await generateAiResponse(config.openrouterApiKey, PROMPTS.themes, context);
        spinner.stop();
        console.log("\n" + chalk.bold.cyan("Themes & Focus Areas"));
        console.log(chalk.cyan("─".repeat(50)));
        console.log(renderMarkdown(response));
        console.log("");
      } catch (err) {
        spinner.fail("Generation failed");
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
