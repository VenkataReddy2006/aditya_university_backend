const fs = require("fs");
const cheerio = require("cheerio");

let html = fs.readFileSync("test_marks_raw.txt", "utf8");
if (html.startsWith("'") && html.endsWith("'")) {
    html = html.substring(1, html.length - 1);
}
html = html.replace(/\\r\\n/g, "\\n").replace(/\\"/g, "\\\"").replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\'/g, "'");

const $ = cheerio.load(html);
$("tr").each((i, tr) => {
    const text = $(tr).text().trim().replace(/\s+/g, " ");
    if (text.includes("EXTERNAL MARKS") || text.includes("ATTENDANCE") || text.includes("INTERNAL MARKS")) {
        console.log("Found row text:", text);
    }
});
