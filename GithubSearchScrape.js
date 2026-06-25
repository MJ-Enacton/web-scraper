// Need to improve code because rate limit getting reached for github search pages

import puppeteer from "puppeteer";
import fs from "fs/promises";
import readline from "readline-sync";

const main = async (query) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  let currentUrl = `https://github.com/search?q=${encodeURIComponent(
    query,
  )}&type=repositories`;

  const allRepos = [];

  while (currentUrl) {
    console.log(`Scraping: ${currentUrl}`);

    await page.goto(currentUrl, {
      waitUntil: "networkidle2",
    });

    try {
      await page.waitForSelector("h3", {
        timeout: 5000,
      });
    } catch {
      console.log("No search results found.");
      break;
    }

    const repositories = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(".Repositories-module__resultContent___BS2W"),
      ).map((repo) => ({
        repo_name:
          repo.querySelector("h3 .search-title a span")?.textContent?.trim() ??
          null,

        repo_desc:
          repo
            .querySelector(".Content-module__Content__mHmep span")
            ?.textContent?.trim() ?? null,

        repo_stars:
          repo.querySelector("ul li a span")?.textContent?.trim() ?? null,
      }));
    });

    console.log(`Found ${repositories.length} repositories`);
  }

  await fs.writeFile(
    "github_search_result.json",
    JSON.stringify(allRepos, null, 2),
  );

  console.log(
    `Saved ${allRepos.length} repositories to github_search_result.json`,
  );

  await browser.close();
};

const search = readline.question("Search a repository name: ");

main(search).catch(console.error);
