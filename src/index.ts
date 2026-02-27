import { Command } from "commander";
import { registerLog } from "./commands/log.js";
import { registerList } from "./commands/list.js";
import { registerPr } from "./commands/pr.js";
import { registerSummary } from "./commands/summary.js";
import { registerThemes } from "./commands/themes.js";
import { registerReview } from "./commands/review.js";
import { registerConfig } from "./commands/config.js";

const program = new Command();

program
  .name("wins")
  .description("Track your engineering wins and get AI-powered summaries of your work")
  .version("1.0.0");

registerLog(program);
registerList(program);
registerPr(program);
registerSummary(program);
registerThemes(program);
registerReview(program);
registerConfig(program);

program.parse(process.argv);
