import { Octokit } from "@octokit/rest";
import type { Config, PrEntry, Store } from "../types.js";

export async function syncPrs(
  config: Config,
  store: Store,
  since?: string
): Promise<{ added: number; updated: number }> {
  if (!config.githubToken) {
    throw new Error("GitHub token not configured. Run: wins config set githubToken <token>");
  }
  if (!config.githubUsername) {
    throw new Error("GitHub username not configured. Run: wins config set githubUsername <username>");
  }
  if (!config.repos || config.repos.length === 0) {
    throw new Error("No repos configured. Run: wins config set repos org/repo,org/repo2");
  }

  const octokit = new Octokit({ auth: config.githubToken });
  const sinceDate = since
    ? new Date(since)
    : store.lastPrSync
    ? new Date(store.lastPrSync)
    : null;

  let added = 0;
  let updated = 0;

  for (const repoFull of config.repos) {
    const [owner, repo] = repoFull.split("/");
    if (!owner || !repo) {
      console.warn(`Skipping invalid repo format: ${repoFull}`);
      continue;
    }

    let page = 1;
    let done = false;

    while (!done) {
      let pulls;
      try {
        const { data } = await octokit.pulls.list({
          owner,
          repo,
          state: "closed",
          sort: "updated",
          direction: "desc",
          per_page: 50,
          page,
        });
        pulls = data;
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 404) {
          throw new Error(
            `Repo not found or token lacks access: ${repoFull}\n` +
            `  • Check the repo name is correct (case-sensitive)\n` +
            `  • Ensure your token has the 'repo' scope (not just 'public_repo')\n` +
            `  • If Felix-Health uses SAML SSO, authorize your token at:\n` +
            `    https://github.com/settings/tokens`
          );
        }
        if (status === 401) {
          throw new Error(
            `GitHub token is invalid or expired. Generate a new one at:\n` +
            `  https://github.com/settings/tokens\nThen run: wins config set githubToken <token>`
          );
        }
        throw err;
      }

      if (pulls.length === 0) break;

      for (const pr of pulls) {
        if (!pr.merged_at || pr.user?.login !== config.githubUsername) {
          continue;
        }

        const mergedAt = new Date(pr.merged_at);
        if (sinceDate && mergedAt < sinceDate) {
          done = true;
          break;
        }

        // Fetch detailed stats
        const { data: detail } = await octokit.pulls.get({
          owner,
          repo,
          pull_number: pr.number,
        });

        const entry: PrEntry = {
          id: pr.id,
          number: pr.number,
          repo: repoFull,
          title: pr.title,
          body: pr.body ?? "",
          url: pr.html_url,
          mergedAt: pr.merged_at,
          labels: pr.labels.map((l) => (typeof l === "string" ? l : l.name ?? "")),
          additions: detail.additions,
          deletions: detail.deletions,
          changedFiles: detail.changed_files,
        };

        const existingIdx = store.prs.findIndex((p) => p.id === entry.id);
        if (existingIdx >= 0) {
          store.prs[existingIdx] = entry;
          updated++;
        } else {
          store.prs.push(entry);
          added++;
        }
      }

      if (pulls.length < 50) done = true;
      page++;
    }
  }

  // Sort PRs by mergedAt desc
  store.prs.sort(
    (a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime()
  );

  store.lastPrSync = new Date().toISOString();
  return { added, updated };
}
