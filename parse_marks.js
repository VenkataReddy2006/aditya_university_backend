
const fs = require("fs");
const cheerio = require("cheerio");

const html = fs.readFileSync("aec_marks.html", "utf8");
const $ = cheerio.load(html);

const data = {
    externalMarks: [],
    previousSemAttendance: [],
    previousSemInternalMarks: []
};

// The tables probably have headers.
// External Marks table might be inside a div or have a specific ID.
// Let us just dump all table IDs and their parent text.
const tables = [];
$("table").each((i, el) => {
    tables.push({
        index: i,
        id: $(el).attr("id"),
        text: $(el).text().substring(0, 100).replace(/\s+/g, " ")
    });
});

fs.writeFileSync("marks_tables.json", JSON.stringify(tables, null, 2));
console.log("Dumped tables overview.");

