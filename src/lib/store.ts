import fs from "fs";
import path from "path";
import os from "os";
import type { Store, Config } from "../types.js";

const CONFIG_PATH = path.join(os.homedir(), ".config", "wins", "config.json");
const DEFAULT_DATA_DIR = path.join(os.homedir(), ".wins");

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function atomicWrite(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

// Config

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { repos: [], dataDir: DEFAULT_DATA_DIR };
  }
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as Config;
}

export function saveConfig(config: Config): void {
  ensureDir(path.dirname(CONFIG_PATH));
  atomicWrite(CONFIG_PATH, config);
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

// Store

function getStorePath(config: Config): string {
  const dataDir =
    process.env.WINS_DIR ?? config.dataDir ?? DEFAULT_DATA_DIR;
  return path.join(dataDir, "store.json");
}

export function loadStore(config: Config): Store {
  const storePath = getStorePath(config);
  if (!fs.existsSync(storePath)) {
    return { wins: [], prs: [], lastPrSync: null };
  }
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as Store;
}

export function saveStore(config: Config, store: Store): void {
  const storePath = getStorePath(config);
  ensureDir(path.dirname(storePath));
  atomicWrite(storePath, store);
}

