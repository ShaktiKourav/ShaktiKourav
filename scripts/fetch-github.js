/**
 * ============================================================
 * fetch-github.js
 * ------------------------------------------------------------
 * Fetch GitHub Profile Information
 * GitHub Repository Statistics
 * GitHub Languages
 * GitHub Followers
 * GitHub Stars
 * Generate JSON for README
 * ============================================================
 */

require("dotenv").config();

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");


const spinner = ora("Loading...").start();

const USERNAME =
  process.env.GITHUB_USERNAME || "ShaktiKourav";

const TOKEN =
  process.env.GITHUB_TOKEN ||
  process.env.METRICS_TOKEN;

const API = "https://api.github.com";

const OUTPUT = path.join(
  __dirname,
  "..",
  "generated"
);

fs.ensureDirSync(OUTPUT);

/* ========================================================= */

const headers = TOKEN
  ? {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": USERNAME,
    }
  : {
      Accept: "application/vnd.github+json",
      "User-Agent": USERNAME,
    };

/* ========================================================= */

const github = axios.create({
  baseURL: API,
  headers,
  timeout: 30000,
});

/* ========================================================= */

async function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

/* ========================================================= */

async function request(url, retries = 3) {
  try {
    const res = await github.get(url);

    return res.data;
  } catch (err) {
    if (retries > 0) {
      console.log(
        chalk.yellow(
          `Retrying ${url}... (${retries})`
        )
      );

      await delay(1500);

      return request(url, retries - 1);
    }

    throw err;
  }
}

/* ========================================================= */

function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(
    num
  );
}

/* ========================================================= */

function save(name, data) {
  fs.writeJSONSync(
    path.join(OUTPUT, `${name}.json`),
    data,
    {
      spaces: 2,
    }
  );
}

/* ========================================================= */

function success(msg) {
  console.log(
    chalk.green(`✔ ${msg}`)
  );
}

function info(msg) {
  console.log(
    chalk.cyan(msg)
  );
}

function error(msg) {
  console.log(
    chalk.red(msg)
  );
}

/* ========================================================= */

spinner.start("Connecting to GitHub API...");


/* ============================================================
   PART 1B-1
   GitHub Profile + Rate Limit + Repository Fetcher
============================================================ */

/**
 * Fetch GitHub profile information
 */
async function fetchProfile() {
  spinner.text = "Fetching GitHub profile...";

  const profile = await request(`/users/${USERNAME}`);

  success("GitHub Profile Loaded");

  return {
    login: profile.login,
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar_url,
    bio: profile.bio,
    company: profile.company,
    blog: profile.blog,
    location: profile.location,
    email: profile.email,
    twitter: profile.twitter_username,

    followers: profile.followers,
    following: profile.following,

    publicRepos: profile.public_repos,
    publicGists: profile.public_gists,

    createdAt: profile.created_at,
    updatedAt: profile.updated_at,

    hireable: profile.hireable,

    htmlUrl: profile.html_url,
  };
}

/* ============================================================ */

/**
 * GitHub API Rate Limit
 */
async function fetchRateLimit() {
  spinner.text = "Checking GitHub API Rate Limit...";

  const limit = await request("/rate_limit");

  success("Rate Limit Checked");

  return {
    limit: limit.rate.limit,
    remaining: limit.rate.remaining,
    used: limit.rate.used,
    reset: new Date(limit.rate.reset * 1000),
  };
}

/* ============================================================ */

/**
 * Fetch all repositories
 */
async function fetchRepositories() {
  spinner.text = "Fetching repositories...";

  let page = 1;
  let repositories = [];

  while (true) {
    const repos = await request(
      `/users/${USERNAME}/repos?per_page=100&page=${page}&sort=updated`
    );

    if (!repos.length) break;

    repositories.push(...repos);

    page++;
  }

  success(`${repositories.length} repositories fetched`);

  return repositories;
}

/* ============================================================ */

/**
 * Remove forks & archived repos
 */
function filterRepositories(repositories) {
  return repositories.filter(
    (repo) =>
      !repo.fork &&
      !repo.archived &&
      !repo.disabled
  );
}

/* ============================================================ */

/**
 * Sort repositories by stars
 */
function sortByStars(repositories) {
  return [...repositories].sort(
    (a, b) => b.stargazers_count - a.stargazers_count
  );
}

/* ============================================================ */

/**
 * Sort repositories by updated date
 */
function sortByUpdated(repositories) {
  return [...repositories].sort(
    (a, b) =>
      new Date(b.updated_at) -
      new Date(a.updated_at)
  );
}

/* ============================================================ */

/**
 * Pick top repositories
 */
function topRepositories(repositories, limit = 6) {
  return sortByStars(repositories).slice(0, limit);
}

/* ============================================================ */

/**
 * Repository Summary
 */
function repositorySummary(repositories) {
  return repositories.map((repo) => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count,
    issues: repo.open_issues_count,
    size: repo.size,
    updated: repo.updated_at,
    url: repo.html_url,
    homepage: repo.homepage,
    visibility: repo.visibility,
  }));
}


/* ============================================================
   PART 1B-2
   Repository Analytics
============================================================ */

/**
 * Calculate total GitHub stars
 */
function calculateTotalStars(repositories) {
  return repositories.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );
}

/* ============================================================ */

/**
 * Calculate total forks
 */
function calculateTotalForks(repositories) {
  return repositories.reduce(
    (total, repo) => total + repo.forks_count,
    0
  );
}

/* ============================================================ */

/**
 * Calculate total watchers
 */
function calculateTotalWatchers(repositories) {
  return repositories.reduce(
    (total, repo) => total + repo.watchers_count,
    0
  );
}

/* ============================================================ */

/**
 * Calculate repository size
 */
function calculateRepositorySize(repositories) {
  return repositories.reduce(
    (total, repo) => total + repo.size,
    0
  );
}

/* ============================================================ */

/**
 * Language usage
 */
function calculateLanguages(repositories) {
  const languages = {};

  repositories.forEach((repo) => {
    if (!repo.language) return;

    if (!languages[repo.language]) {
      languages[repo.language] = 0;
    }

    languages[repo.language]++;
  });

  return languages;
}

/* ============================================================ */

/**
 * Sort languages
 */
function sortLanguages(languages) {
  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({
      language,
      count,
    }));
}

/* ============================================================ */

/**
 * Language percentage
 */
function languagePercentage(sortedLanguages) {
  const total = sortedLanguages.reduce(
    (sum, lang) => sum + lang.count,
    0
  );

  return sortedLanguages.map((lang) => ({
    language: lang.language,
    count: lang.count,
    percentage:
      total === 0
        ? 0
        : ((lang.count / total) * 100).toFixed(1),
  }));
}

/* ============================================================ */

/**
 * Most used language
 */
function mostUsedLanguage(sortedLanguages) {
  if (!sortedLanguages.length)
    return "Unknown";

  return sortedLanguages[0].language;
}

/* ============================================================ */

/**
 * Repository Statistics
 */
function repositoryStatistics(repositories) {
  return {
    repositories: repositories.length,

    totalStars: calculateTotalStars(repositories),

    totalForks: calculateTotalForks(repositories),

    totalWatchers:
      calculateTotalWatchers(repositories),

    totalSize:
      calculateRepositorySize(repositories),

    averageStars:
      repositories.length === 0
        ? 0
        : (
            calculateTotalStars(repositories) /
            repositories.length
          ).toFixed(2),

    averageForks:
      repositories.length === 0
        ? 0
        : (
            calculateTotalForks(repositories) /
            repositories.length
          ).toFixed(2),

    averageWatchers:
      repositories.length === 0
        ? 0
        : (
            calculateTotalWatchers(repositories) /
            repositories.length
          ).toFixed(2),
  };
}

/* ============================================================ */

/**
 * Top Languages
 */
function topLanguages(repositories) {
  return languagePercentage(
    sortLanguages(
      calculateLanguages(repositories)
    )
  );
}

/* ============================================================ */

/**
 * Save Repository Statistics
 */
function saveRepositoryStats(repositories) {
  const stats = repositoryStatistics(repositories);

  const languages = topLanguages(repositories);

  save("github-stats", stats);

  save("languages", languages);

  success("Repository statistics saved");
}

/* ============================================================ */

/**
 * Save Repository List
 */
function saveRepositoryList(repositories) {
  save(
    "repositories",
    repositorySummary(repositories)
  );

  success("Repository list saved");
}

/* ============================================================ */

/**
 * Save Top Repositories
 */
function saveTopRepositories(repositories) {
  save(
    "top-repositories",
    repositorySummary(
      topRepositories(repositories, 10)
    )
  );

  success("Top repositories saved");
}

/* ============================================================
   PART 1B-3A
   Profile Summary + Markdown Generator
============================================================ */

/**
 * Build profile summary
 */
function buildProfileSummary(profile, stats, languages) {
  return {
    username: profile.login,
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    company: profile.company,

    followers: profile.followers,
    following: profile.following,

    repositories: stats.repositories,

    totalStars: stats.totalStars,
    totalForks: stats.totalForks,
    totalWatchers: stats.totalWatchers,

    mostUsedLanguage:
      languages.length > 0
        ? languages[0].language
        : "Unknown",

    joined: profile.createdAt,

    profile: profile.htmlUrl,

    generatedAt: new Date().toISOString(),
  };
}

/* ============================================================ */

/**
 * Markdown Builder
 */
function generateMarkdown(summary, languages) {
  const topFive = languages.slice(0, 5);

  return `# GitHub Summary

## 👤 Profile

| Item | Value |
|------|-------|
| Name | ${summary.name || "-"} |
| Username | ${summary.username} |
| Followers | ${formatNumber(summary.followers)} |
| Following | ${formatNumber(summary.following)} |
| Public Repositories | ${formatNumber(summary.repositories)} |
| Total Stars | ⭐ ${formatNumber(summary.totalStars)} |
| Total Forks | 🍴 ${formatNumber(summary.totalForks)} |
| Total Watchers | 👀 ${formatNumber(summary.totalWatchers)} |
| Most Used Language | ${summary.mostUsedLanguage} |

---

## 💻 Top Languages

${topFive
  .map(
    (lang) =>
      `- ${lang.language} (${lang.percentage}%)`
  )
  .join("\n")}

---

_Last Updated: ${new Date().toLocaleString()}_
`;
}

/* ============================================================ */

/**
 * Save summary files
 */
function saveSummary(summary, markdown) {
  save("profile-summary", summary);

  fs.writeFileSync(
    path.join(OUTPUT, "profile-summary.md"),
    markdown,
    "utf8"
  );

  success("Profile summary generated");
}

/* ============================================================ */

/**
 * Console Report
 */
function printReport(summary) {
  console.log("");

  console.log(
    chalk.blue.bold(
      "=========== GitHub Summary ==========="
    )
  );

  console.log(
    chalk.green("User        :"),
    summary.username
  );

  console.log(
    chalk.green("Repositories:"),
    summary.repositories
  );

  console.log(
    chalk.green("Followers   :"),
    summary.followers
  );

  console.log(
    chalk.green("Stars       :"),
    summary.totalStars
  );

  console.log(
    chalk.green("Forks       :"),
    summary.totalForks
  );

  console.log(
    chalk.green("Language    :"),
    summary.mostUsedLanguage
  );

  console.log(
    chalk.blue.bold(
      "======================================"
    )
  );

  console.log("");
}

/* ============================================================
   PART 1B-3B
   Main Execution
============================================================ */

async function main() {
  try {
    spinner.start("Starting GitHub Fetch...");

    /* ------------------------------------- */
    /* Fetch Data */
    /* ------------------------------------- */

    const profile = await fetchProfile();

    await fetchRateLimit();

    let repositories = await fetchRepositories();

    repositories = filterRepositories(repositories);

    /* ------------------------------------- */
    /* Statistics */
    /* ------------------------------------- */

    const stats = repositoryStatistics(repositories);

    const languages = topLanguages(repositories);

    /* ------------------------------------- */
    /* Save JSON Files */
    /* ------------------------------------- */

    saveRepositoryStats(repositories);

    saveRepositoryList(repositories);

    saveTopRepositories(repositories);

    save("profile", profile);

    /* ------------------------------------- */
    /* Profile Summary */
    /* ------------------------------------- */

    const summary = buildProfileSummary(
      profile,
      stats,
      languages
    );

    const markdown = generateMarkdown(
      summary,
      languages
    );

    saveSummary(summary, markdown);

    /* ------------------------------------- */
    /* Report */
    /* ------------------------------------- */

    printReport(summary);

    spinner.succeed(
      "GitHub Statistics Generated Successfully"
    );

    success("All JSON files created.");

    success("Markdown summary created.");

    success("Completed.");

    process.exit(0);
  } catch (err) {
    spinner.fail("GitHub Fetch Failed");

    console.log("");

    error("Something went wrong.");

    console.log("");

    console.error(err.message);

    console.log("");

    process.exit(1);
  }
}

/* ============================================================
   Run Script
============================================================ */

main();