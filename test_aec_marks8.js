
const fs = require("fs");
const html = fs.readFileSync("test_marks_raw.txt", "utf8");
let idx = html.indexOf("EXTERNAL MARKS");
console.log("Ext HTML:\n", html.substring(idx - 50, idx + 2000));

