import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig, loadStore } from "../lib/store.js";
import { buildContext, generateAiResponse, PROMPTS } from "../lib/ai.js";
import { renderMarkdown } from "../lib/format.js";

type ReviewFormat = "star" | "bullet" | "prose";

export function registerReview(program: Command): void {
  program
    .command("review")
    .description("AI: full performance review narrative")
    .option("--since <date>", "Filter from date (YYYY-MM-DD)")
    .option("--until <date>", "Filter until date (YYYY-MM-DD)")
    .option(
      "--format <format>",
      "Output format: star | bullet | prose",
      "bullet"
    )
    .action(
      async (options: {
        since?: string;
        until?: string;
        format: ReviewFormat;
      }) => {
        const config = loadConfig();

        if (!config.openrouterApiKey) {
          console.error(
            chalk.red(
              "OpenRouter API key not configured. Run: wins config set openrouterApiKey <key>"
            )
          );
          process.exit(1);
        }

        const validFormats: ReviewFormat[] = ["star", "bullet", "prose"];
        if (!validFormats.includes(options.format)) {
          console.error(
            chalk.red(`Invalid format "${options.format}". Use: star | bullet | prose`)
          );
          process.exit(1);
        }

        const store = loadStore(config);
        const context = buildContext(store, options.since, options.until);

        const promptKey =
          `review${options.format.charAt(0).toUpperCase()}${options.format.slice(1)}` as keyof typeof PROMPTS;
        const prompt = PROMPTS[promptKey];

        const formatLabels: Record<ReviewFormat, string> = {
          star: "STAR Format",
          bullet: "Bullet Points",
          prose: "Prose Narrative",
        };

        const spinner = ora("Generating review…").start();

        try {
          const response = await generateAiResponse(config.openrouterApiKey, prompt, context);
          spinner.stop();
          console.log(
            "\n" + chalk.bold.cyan(`Performance Review — ${formatLabels[options.format]}`)
          );
          console.log(chalk.cyan("─".repeat(50)));
          console.log(renderMarkdown(response));
          console.log("");
        } catch (err) {
          spinner.fail("Generation failed");
          console.error(chalk.red((err as Error).message));
          process.exit(1);
        }
      }
    );
}
