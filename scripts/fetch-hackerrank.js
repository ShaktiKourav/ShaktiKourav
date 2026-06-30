/**
 * ============================================================
 * fetch-hackerrank.js
 * ------------------------------------------------------------
 * Fetch HackerRank Profile Stats (Unofficial API Scraper)
 * Generates JSON for README automation system
 * ============================================================
 */

require("dotenv").config();

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

const spinner = ora();

/* ============================================================
   CONFIG
============================================================ */

const USERNAME =
  process.env.HACKERRANK_USERNAME || "kouravshakti72";

const OUTPUT = path.join(__dirname, "..", "generated");

fs.ensureDirSync(OUTPUT);

/* ============================================================
   HELPERS
============================================================ */

function save(name, data) {
  fs.writeJSONSync(
    path.join(OUTPUT, `${name}.json`),
    data,
    { spaces: 2 }
  );
}

function error(msg) {
  console.log(chalk.red(msg));
}

function success(msg) {
  console.log(chalk.green(`✔ ${msg}`));
}

/* ============================================================
   FETCH HTML PROFILE
============================================================ */

async function fetchProfileHTML() {
  const url = `https://www.hackerrank.com/profile/${USERNAME}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 20000,
    });

    return data;
  } catch (err) {
    throw new Error("Failed to fetch HackerRank profile");
  }
}

/* ============================================================
   EXTRACT DATA (Regex based parsing)
============================================================ */

function extractData(html) {
  const get = (regex) => {
    const match = html.match(regex);
    return match ? match[1] : null;
  };

  // Basic stats (HackerRank DOM changes frequently)
  const rank = get(/Rank\s*<\/.*?>\s*([\d,]+)/i);
  const badges = get(/Badges.*?([\d,]+)/i);
  const points = get(/Total\s*Points.*?([\d,]+)/i);

  const solvedEasy = get(/Easy.*?(\d+\/\d+)/i);
  const solvedMedium = get(/Medium.*?(\d+\/\d+)/i);
  const solvedHard = get(/Hard.*?(\d+\/\d+)/i);

  return {
    username: USERNAME,
    rank: rank || "N/A",
    badges: badges || "0",
    points: points || "0",

    solved: {
      easy: solvedEasy || "0/0",
      medium: solvedMedium || "0/0",
      hard: solvedHard || "0/0",
    },

    profileUrl: `https://www.hackerrank.com/profile/${USERNAME}`,
    fetchedAt: new Date().toISOString(),
  };
}

/* ============================================================
   MAIN FUNCTION
============================================================ */

async function main() {
  const spinner = ora("Fetching HackerRank profile...").start();

  try {
    const html = await fetchProfileHTML();

    const data = extractData(html);

    save("hackerrank", data);

    spinner.succeed("HackerRank data fetched");

    console.log("");

    console.log(chalk.blue("===== HackerRank Summary ====="));
    console.log("Username :", data.username);
    console.log("Rank     :", data.rank);
    console.log("Badges   :", data.badges);
    console.log("Points   :", data.points);
    console.log("Easy     :", data.solved.easy);
    console.log("Medium   :", data.solved.medium);
    console.log("Hard     :", data.solved.hard);
    console.log("================================");

    success("Saved: generated/hackerrank.json");

    process.exit(0);
  } catch (err) {
    spinner.fail("Failed to fetch HackerRank");

    error(err.message);

    process.exit(1);
  }
}

/* ============================================================
   RUN
============================================================ */

main();