import puppeteer from "puppeteer";
import fs from "fs/promises"
import { createObjectCsvWriter } from "csv-writer";
const allBooks = [];

const scrapeOnePage = async (page) => {
  const books = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".product_pod")).map((book) => ({
      title: book.querySelector("h3 > a").title,
      single_poroduct_link: book.querySelector("h3 > a").href,
      image: book.querySelector("div > a > img").src,
      price: book.querySelector(".price_color").textContent,
      star_rating: book.querySelector("p").className.split(" ")[1],
    }));
  });

  return books;
}

const writeToCSV = async (data) => {
  const csvwriter = createObjectCsvWriter(
    {
      path : "./data/books.csv",
      header : [
        {id: "title", title: "Title"},
        {id: "single_poroduct_link", title: "Link"},
        {id: "image", title: "Image"},
        {id: "price", title: "Price"},
        {id: "star_rating", title: "Rating"}
      ]
    }
  );
  await csvwriter.writeRecords(data);
}

const main = async () => {
  const browser = await puppeteer.launch({
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.goto("https://books.toscrape.com/", {
    waitUntil: "domcontentloaded",
  });

  while (true) {
    // Get books from current page
    const books = await scrapeOnePage(page)
    allBooks.push(...books)
    const nextButton = await page.$(".pager .next > a");

    if (!nextButton) {
      break;
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      nextButton.click(),
    ]);
  }
  await fs.writeFile("books.json", JSON.stringify(allBooks, null, 2));
  await writeToCSV(allBooks);
  await browser.close();
};

main();
