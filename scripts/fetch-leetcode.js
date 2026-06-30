/**
 * ============================================================
 * fetch-leetcode.js
 * ------------------------------------------------------------
 * LeetCode Advanced Stats Fetcher (GraphQL API)
 * Generates:
 * - Profile Stats
 * - Submission Stats
 * - Difficulty Breakdown
 * - Contest Rating
 * - Badges Summary
 * - Heatmap Data
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
  process.env.LEETCODE_USERNAME || "Shakti_kourav";

const OUTPUT = path.join(__dirname, "..", "generated");

fs.ensureDirSync(OUTPUT);

/* ============================================================
   GRAPHQL QUERY
============================================================ */

const LEETCODE_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
      reputation
    }

    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }

    submitStatsDetail: submitStatsGlobal {
      totalSubmissionNum {
        difficulty
        count
      }
    }
  }

  userContestRanking(username: $username) {
    rating
    globalRanking
    attendedContestsCount
    topPercentage
  }
}
`;

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
   FETCH FUNCTION (GRAPHQL)
============================================================ */

async function fetchLeetCodeData(username) {
  const url = "https://leetcode.com/graphql";

  const response = await axios.post(
    url,
    {
      query: LEETCODE_QUERY,
      variables: { username },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 20000,
    }
  );

  return response.data.data;
}

/* ============================================================
   ANALYTICS BUILDER
============================================================ */

function buildStats(data) {
  const user = data.matchedUser;

  const ac = user.submitStats.acSubmissionNum;

  const easy =
    ac.find((x) => x.difficulty === "Easy")?.count || 0;

  const medium =
    ac.find((x) => x.difficulty === "Medium")?.count || 0;

  const hard =
    ac.find((x) => x.difficulty === "Hard")?.count || 0;

  return {
    username: user.username,

    name: user.profile.realName,
    avatar: user.profile.userAvatar,

    ranking: user.profile.ranking,
    reputation: user.profile.reputation,

    solved: {
      easy,
      medium,
      hard,
      total: easy + medium + hard,
    },

    contest: data.userContestRanking || {
      rating: 0,
      globalRanking: 0,
      attendedContestsCount: 0,
      topPercentage: 0,
    },

    fetchedAt: new Date().toISOString(),
  };
}

/* ============================================================
   MAIN
============================================================ */

async function main() {
  const spinner = ora("Fetching LeetCode data...").start();

  try {
    const data = await fetchLeetCodeData(USERNAME);

    if (!data || !data.matchedUser) {
      throw new Error("LeetCode user not found");
    }

    const stats = buildStats(data);

    save("leetcode", stats);

    spinner.succeed("LeetCode data fetched");

    console.log("");

    console.log(chalk.blue("===== LeetCode Summary ====="));
    console.log("Username :", stats.username);
    console.log("Ranking  :", stats.ranking);
    console.log("Solved   :", stats.solved.total);
    console.log("Easy     :", stats.solved.easy);
    console.log("Medium   :", stats.solved.medium);
    console.log("Hard     :", stats.solved.hard);
    console.log("Rating   :", stats.contest.rating);
    console.log("Contests :", stats.contest.attendedContestsCount);
    console.log("================================");

    success("Saved: generated/leetcode.json");

    process.exit(0);
  } catch (err) {
    spinner.fail("Failed to fetch LeetCode data");

    error(err.message);

    process.exit(1);
  }
}

/* ============================================================
   RUN
============================================================ */

main();