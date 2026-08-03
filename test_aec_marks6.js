
const fs = require("fs");
const html = fs.readFileSync("test_marks_raw.txt", "utf8");
const idx = html.indexOf("EXTERNAL MARKS");
console.log("Found at:", idx);
if (idx > -1) {
    console.log("Context:", html.substring(Math.max(0, idx - 100), idx + 100));
}

