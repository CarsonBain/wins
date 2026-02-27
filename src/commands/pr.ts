import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig, loadStore, saveStore } from "../lib/store.js";
import { syncPrs } from "../lib/github.js";

export function registerPr(program: Command): void {
  const pr = program
    .command("pr")
    .description("Manage GitHub PR sync");

  pr.command("sync")
    .description("Fetch merged PRs from GitHub")
    .option("--since <date>", "Fetch PRs merged after this date (YYYY-MM-DD)")
    .action(async (options: { since?: string }) => {
      const config = loadConfig();
      const store = loadStore(config);

      const spinner = ora("Syncing PRs from GitHub…").start();

      try {
        const { added, updated } = await syncPrs(config, store, options.since);
        saveStore(config, store);
        spinner.succeed(
          `Sync complete: ${chalk.green(added)} added, ${chalk.yellow(updated)} updated`
        );
      } catch (err) {
        spinner.fail("Sync failed");
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
