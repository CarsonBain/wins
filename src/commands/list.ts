import { Command } from "commander";
import chalk from "chalk";
import { format } from "date-fns";
import { loadConfig, loadStore } from "../lib/store.js";
import type { WinEntry, PrEntry } from "../types.js";

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

export function registerList(program: Command): void {
  program
    .command("list")
    .description("Print wins (and optionally PRs)")
    .option("--since <date>", "Filter from date (YYYY-MM-DD)")
    .option("--until <date>", "Filter until date (YYYY-MM-DD)")
    .option("--prs", "Include merged PRs", false)
    .action((options: { since?: string; until?: string; prs: boolean }) => {
      const config = loadConfig();
      const store = loadStore(config);

      const wins = filterByDate(store.wins, options.since, options.until);
      const prs = options.prs
        ? filterByDate(store.prs, options.since, options.until)
        : [];

      if (wins.length === 0 && prs.length === 0) {
        console.log(chalk.dim("No entries found."));
        return;
      }

      if (wins.length > 0) {
        console.log(chalk.bold.cyan("\nWins"));
        console.log(chalk.dim("─".repeat(50)));
        for (const w of wins) {
          const date = format(new Date(w.timestamp), "yyyy-MM-dd");
          const tags =
            w.tags.length > 0
              ? " " + chalk.dim(`[${w.tags.join(", ")}]`)
              : "";
          console.log(
            `${chalk.dim(date)}  ${chalk.white(w.content)}${tags}`
          );
        }
      }

      if (prs.length > 0) {
        console.log(chalk.bold.magenta("\nMerged PRs"));
        console.log(chalk.dim("─".repeat(50)));
        for (const pr of prs) {
          const date = format(new Date(pr.mergedAt), "yyyy-MM-dd");
          const labels =
            pr.labels.length > 0
              ? " " + chalk.dim(`[${pr.labels.join(", ")}]`)
              : "";
          console.log(
            `${chalk.dim(date)}  ${chalk.bold(pr.repo)}#${pr.number}: ${chalk.white(pr.title)}${labels}`
          );
          console.log(
            chalk.dim(
              `           +${pr.additions}/-${pr.deletions}, ${pr.changedFiles} files  ${pr.url}`
            )
          );
        }
      }

      console.log("");
    });
}
