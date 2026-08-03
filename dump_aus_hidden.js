
const fs = require("fs");
const cheerio = require("cheerio");
const html = fs.readFileSync("aus_login.html", "utf8");
const $ = cheerio.load(html);
$("input[type=hidden]").each((i, el) => {
    console.log($(el).attr("name"), "=", $(el).attr("value"));
});

