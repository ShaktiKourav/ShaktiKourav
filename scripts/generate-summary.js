/**
 * ============================================================
 * generate-summary.js
 * ------------------------------------------------------------
 * MASTER AGGREGATOR FILE
 * Combines:
 *  - GitHub Stats
 *  - LeetCode Stats
 *  - HackerRank Stats
 *  - Microsoft Learn Stats
 *
 * Outputs:
 *  - unified-summary.json
 *  - README section markdown
 * ============================================================
 */

require("dotenv").config();

const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

const spinner = ora();

/* ============================================================
   PATHS
============================================================ */

const GENERATED = path.join(__dirname, "..", "generated");

fs.ensureDirSync(GENERATED);

/* ============================================================
   LOAD JSON FILES
============================================================ */

function load(file) {
  try {
    return fs.readJSONSync(path.join(GENERATED, file));
  } catch {
    return null;
  }
}

/* ============================================================
   LOAD ALL SOURCES
============================================================ */

function loadData() {
  const github = load("profile.json");
  const leetcode = load("leetcode.json");
  const hackerrank = load("hackerrank.json");
  const mslearn = load("microsoft-learn.json");

  return { github, leetcode, hackerrank, mslearn };
}

/* ============================================================
   BUILD MASTER SUMMARY
============================================================ */

function buildSummary(data) {
  const { github, leetcode, hackerrank, mslearn } = data;

  return {
    developer: {
      name: github?.name || "Developer",
      username: github?.login || "unknown",
      avatar: github?.avatar,
    },

    github: {
      repos: github?.publicRepos || 0,
      followers: github?.followers || 0,
      stars: github?.totalStars || 0,
      forks: github?.totalForks || 0,
    },

    leetcode: {
      solved: leetcode?.solved?.total || 0,
      easy: leetcode?.solved?.easy || 0,
      medium: leetcode?.solved?.medium || 0,
      hard: leetcode?.solved?.hard || 0,
      rating: leetcode?.contest?.rating || 0,
    },

    hackerrank: {
      rank: hackerrank?.rank || "N/A",
      badges: hackerrank?.badges || 0,
      points: hackerrank?.points || 0,
    },

    microsoftLearn: {
      xp: mslearn?.xp?.totalXP || 0,
      level: mslearn?.xp?.level || 0,
      badges: mslearn?.totalBadges || 0,
      achievements: mslearn?.totalAchievements || 0,
    },

    generatedAt: new Date().toISOString(),
  };
}

/* ============================================================
   GENERATE README SECTION
============================================================ */

function generateReadme(summary) {
  return `
# 🚀 Developer Intelligence Dashboard

## 👤 Profile

- Name: ${summary.developer.name}
- Username: ${summary.developer.username}

---

## 💻 GitHub Stats

- Repositories: ${summary.github.repos}
- Followers: ${summary.github.followers}
- Stars: ${summary.github.stars}
- Forks: ${summary.github.forks}

---

## 🧠 LeetCode Stats

- Solved: ${summary.leetcode.solved}
- Easy: ${summary.leetcode.easy}
- Medium: ${summary.leetcode.medium}
- Hard: ${summary.leetcode.hard}
- Rating: ${summary.leetcode.rating}

---

## 🟩 HackerRank Stats

- Rank: ${summary.hackerrank.rank}
- Badges: ${summary.hackerrank.badges}
- Points: ${summary.hackerrank.points}

---

## ☁ Microsoft Learn

- XP: ${summary.microsoftLearn.xp}
- Level: ${summary.microsoftLearn.level}
- Badges: ${summary.microsoftLearn.badges}
- Achievements: ${summary.microsoftLearn.achievements}

---

## 📅 Generated

${summary.generatedAt}

---
`;
}

/* ============================================================
   SAVE OUTPUTS
============================================================ */

function saveAll(summary, markdown) {
  fs.writeJSONSync(
    path.join(GENERATED, "unified-summary.json"),
    summary,
    { spaces: 2 }
  );

  fs.writeFileSync(
    path.join(GENERATED, "README-DASHBOARD.md"),
    markdown,
    "utf8"
  );
}

/* ============================================================
   MAIN
============================================================ */

async function main() {
  const spinner = ora("Generating unified summary...").start();

  try {
    const data = loadData();

    const summary = buildSummary(data);

    const markdown = generateReadme(summary);

    saveAll(summary, markdown);

    spinner.succeed("Unified summary generated");

    console.log("");

    console.log(chalk.blue("===== MASTER SUMMARY ====="));
    console.log(summary);
    console.log("==========================");

    console.log("");

    console.log(
      chalk.green("✔ unified-summary.json created")
    );

    console.log(
      chalk.green("✔ README-DASHBOARD.md created")
    );

    process.exit(0);
  } catch (err) {
    spinner.fail("Summary generation failed");

    console.error(err);

    process.exit(1);
  }
}

/* ============================================================
   RUN
============================================================ */

main();