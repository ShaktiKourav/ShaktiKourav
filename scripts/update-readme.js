/**
 * ============================================================
 * update-readme.js
 * ------------------------------------------------------------
 * Auto README Injector
 * - Reads generated JSON
 * - Injects into README.md between markers
 * - GitHub Actions friendly
 * ============================================================
 */

require("dotenv").config();

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");

const spinner = ora();

/* ============================================================
   PATHS
============================================================ */

const ROOT = path.join(__dirname, "..");
const GENERATED = path.join(ROOT, "generated");
const README_PATH = path.join(ROOT, "README.md");

/* ============================================================
   LOAD DATA
============================================================ */

function load(file) {
  try {
    return fs.readJSONSync(path.join(GENERATED, file));
  } catch {
    return null;
  }
}

/* ============================================================
   BUILD READABLE STATS BLOCK
============================================================ */

function buildStatsBlock(data) {
  const github = data.github;
  const leetcode = data.leetcode;
  const hackerrank = data.hackerrank;
  const mslearn = data.mslearn;

  return `
<!-- ================= AUTO GENERATED STATS ================= -->

## 📊 Developer Dashboard

### 💻 GitHub
- Repositories: ${github?.repos || 0}
- Followers: ${github?.followers || 0}
- Stars: ${github?.stars || 0}
- Forks: ${github?.forks || 0}

### 🧠 LeetCode
- Solved: ${leetcode?.solved || 0}
- Easy: ${leetcode?.easy || 0}
- Medium: ${leetcode?.medium || 0}
- Hard: ${leetcode?.hard || 0}
- Rating: ${leetcode?.rating || 0}

### 🟩 HackerRank
- Rank: ${hackerrank?.rank || "N/A"}
- Badges: ${hackerrank?.badges || 0}
- Points: ${hackerrank?.points || 0}

### ☁ Microsoft Learn
- XP: ${mslearn?.xp?.totalXP || 0}
- Level: ${mslearn?.xp?.level || 0}
- Badges: ${mslearn?.totalBadges || 0}
- Achievements: ${mslearn?.totalAchievements || 0}

<!-- ======================================================== -->
`;
}

/* ============================================================
   INJECT INTO README
============================================================ */

function inject(content, block) {
  const start = "<!--START_SECTION:stats-->";
  const end = "<!--END_SECTION:stats-->";

  const regex = new RegExp(
    `${start}[\\s\\S]*?${end}`,
    "g"
  );

  const replacement = `${start}\n${block}\n${end}`;

  if (!content.includes(start)) {
    return content + "\n\n" + replacement;
  }

  return content.replace(regex, replacement);
}

/* ============================================================
   MAIN
============================================================ */

async function main() {
  const spinner = ora("Updating README.md...").start();

  try {
    const github = load("profile.json");
    const leetcode = load("leetcode.json");
    const hackerrank = load("hackerrank.json");
    const mslearn = load("microsoft-learn.json");

    const data = {
      github,
      leetcode,
      hackerrank,
      mslearn,
    };

    const statsBlock = buildStatsBlock(data);

    let readme = fs.readFileSync(
      README_PATH,
      "utf8"
    );

    const updated = inject(readme, statsBlock);

    fs.writeFileSync(README_PATH, updated, "utf8");

    spinner.succeed("README updated successfully");

    console.log("");

    console.log(
      chalk.green("✔ README.md updated with latest stats")
    );

    console.log(
      chalk.blue("✔ Injected between markers:")
    );

    console.log("<!--START_SECTION:stats-->");
    console.log("<!--END_SECTION:stats-->");

    process.exit(0);
  } catch (err) {
    spinner.fail("README update failed");

    console.error(err.message);

    process.exit(1);
  }
}

/* ============================================================
   RUN
============================================================ */

main();