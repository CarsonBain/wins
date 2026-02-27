import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig, loadStore } from "../lib/store.js";
import { buildContext, generateAiResponse, PROMPTS } from "../lib/ai.js";
import { renderMarkdown } from "../lib/format.js";

export function registerSummary(program: Command): void {
  program
    .command("summary")
    .description("AI-generated 3–5 sentence accomplishment summary")
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

      const spinner = ora("Generating summary…").start();

      try {
        const response = await generateAiResponse(config.openrouterApiKey, PROMPTS.summary, context);
        spinner.stop();
        console.log("\n" + chalk.bold.cyan("Accomplishment Summary"));
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
