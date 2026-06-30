/**
 * ============================================================
 * fetch-mslearn.js (STABLE VERSION)
 * ------------------------------------------------------------
 * Microsoft Learn Safe Tracker (NO BROKEN API)
 * - Prevents API failures
 * - Provides fallback static + simulated data
 * - GitHub Actions safe
 * ============================================================
 */

require("dotenv").config();

const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");

const spinner = ora();

/* ============================================================
   CONFIG
============================================================ */

const OUTPUT = path.join(__dirname, "..", "generated");
fs.ensureDirSync(OUTPUT);

/* ============================================================
   SAFE DATA (NO API DEPENDENCY)
============================================================ */

const MSLEARN_DATA = {
  user: "shaktikourav-7326",
  name: "Shakti Kourav",
  title: "Frontend Developer | C++ | DSA Learner",
  country: "India",

  // You can manually update these anytime
  xp: {
    baseXP: 1200,
    badgeXP: 450,
    achievementXP: 1680,
    totalXP: 3330,
    level: 6
  },

  totalBadges: 9,
  totalAchievements: 14,

  profileUrl:
    "https://learn.microsoft.com/en-us/users/shaktikourav-7326/",

  updatedAt: new Date().toISOString()
};

/* ============================================================
   SAVE FUNCTION
============================================================ */

function save(name, data) {
  fs.writeJSONSync(
    path.join(OUTPUT, `${name}.json`),
    data,
    { spaces: 2 }
  );
}

/* ============================================================
   MAIN
============================================================ */

async function main() {
  const spinner = ora(
    "Generating Microsoft Learn safe data..."
  ).start();

  try {
    // Save main summary
    save("microsoft-learn", MSLEARN_DATA);

    // Optional breakdown files
    save("mslearn-badges", {
      total: MSLEARN_DATA.totalBadges,
      items: Array(MSLEARN_DATA.totalBadges).fill({
        name: "Microsoft Learn Badge"
      })
    });

    save("mslearn-achievements", {
      total: MSLEARN_DATA.totalAchievements,
      items: Array(MSLEARN_DATA.totalAchievements).fill({
        name: "Learning Achievement"
      })
    });

    spinner.succeed("Microsoft Learn data generated safely");

    console.log("");

    console.log(chalk.blue("===== MS LEARN SUMMARY ====="));
    console.log("User   :", MSLEARN_DATA.user);
    console.log("XP     :", MSLEARN_DATA.xp.totalXP);
    console.log("Level  :", MSLEARN_DATA.xp.level);
    console.log("Badges :", MSLEARN_DATA.totalBadges);
    console.log("Achievements :", MSLEARN_DATA.totalAchievements);
    console.log("============================");

    console.log(chalk.green("✔ Files saved in /generated"));

    process.exit(0);
  } catch (err) {
    spinner.fail("Failed to generate MS Learn data");

    console.error(err);

    process.exit(1);
  }
}

/* ============================================================
   RUN
============================================================ */

main();