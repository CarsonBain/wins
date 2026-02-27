import { Command } from "commander";
import chalk from "chalk";
import readline from "readline";
import { loadConfig, saveConfig, getConfigPath } from "../lib/store.js";
import type { Config } from "../types.js";

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function runInit(): Promise<void> {
  const config = loadConfig();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.bold.cyan("\nwins config init\n"));
  console.log(chalk.dim("Press Enter to keep existing value. Leave blank to skip.\n"));

  const openrouterApiKey = await prompt(
    rl,
    `OpenRouter API key ${config.openrouterApiKey ? chalk.dim("[existing]") : chalk.dim("[none]")}: `
  );
  const githubToken = await prompt(
    rl,
    `GitHub Personal Access Token ${config.githubToken ? chalk.dim("[existing]") : chalk.dim("[none]")}: `
  );
  const githubUsername = await prompt(
    rl,
    `GitHub Username ${config.githubUsername ? chalk.dim(`[${config.githubUsername}]`) : chalk.dim("[none]")}: `
  );
  const reposRaw = await prompt(
    rl,
    `Repos to track (comma-separated, e.g. org/repo1,org/repo2) ${config.repos.length > 0 ? chalk.dim(`[${config.repos.join(",")}]`) : chalk.dim("[none]")}: `
  );

  const defaultDataDir = config.dataDir || `${process.env.HOME}/.wins`;
  const dataDir = await prompt(
    rl,
    `Data directory ${chalk.dim(`[${defaultDataDir}]`)}: `
  );

  rl.close();

  const updated: Config = {
    openrouterApiKey: openrouterApiKey.trim() || config.openrouterApiKey,
    githubToken: githubToken.trim() || config.githubToken,
    githubUsername: githubUsername.trim() || config.githubUsername,
    repos:
      reposRaw.trim()
        ? reposRaw.split(",").map((r) => r.trim()).filter(Boolean)
        : config.repos,
    dataDir: dataDir.trim() || defaultDataDir,
  };

  saveConfig(updated);
  console.log(chalk.green("\n✓ Config saved to " + getConfigPath()));
}

export function registerConfig(program: Command): void {
  const cfg = program
    .command("config")
    .description("Manage wins configuration");

  cfg
    .command("init")
    .description("Interactive setup")
    .action(async () => {
      await runInit();
    });

  cfg
    .command("set <key> <value>")
    .description("Update a single config value")
    .action((key: string, value: string) => {
      const config = loadConfig();

      const validKeys: (keyof Config)[] = [
        "openrouterApiKey",
        "githubToken",
        "githubUsername",
        "repos",
        "dataDir",
      ];

      if (!validKeys.includes(key as keyof Config)) {
        console.error(
          chalk.red(`Unknown config key: ${key}. Valid keys: ${validKeys.join(", ")}`)
        );
        process.exit(1);
      }

      if (key === "repos") {
        (config as Config).repos = value
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);
      } else {
        (config as Record<string, unknown>)[key] = value;
      }

      saveConfig(config);
      console.log(chalk.green(`✓ Set ${key} = ${key.toLowerCase().includes("key") || key.toLowerCase().includes("token") ? "***" : value}`));
    });

  cfg
    .command("get [key]")
    .description("Print config (or a single value)")
    .action((key?: string) => {
      const config = loadConfig();

      if (key) {
        const val = (config as Record<string, unknown>)[key];
        if (val === undefined) {
          console.error(chalk.red(`Unknown key: ${key}`));
          process.exit(1);
        }
        console.log(val);
      } else {
        const display: Record<string, unknown> = {
          ...config,
          openrouterApiKey: config.openrouterApiKey ? "***" : undefined,
          githubToken: config.githubToken ? "***" : undefined,
        };
        console.log(chalk.bold("Config path:"), getConfigPath());
        console.log(JSON.stringify(display, null, 2));
      }
    });
}
