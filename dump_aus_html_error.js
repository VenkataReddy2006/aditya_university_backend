
const fs = require("fs");
const cheerio = require("cheerio");
const html = fs.readFileSync("aus_failed_login.html", "utf8");
const $ = cheerio.load(html);
console.log("lblError:", $("#lblError").text().trim());
console.log("lblResult:", $("#lblResult").text().trim());

