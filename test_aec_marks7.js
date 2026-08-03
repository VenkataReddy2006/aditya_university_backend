
const fs = require("fs");
const html = fs.readFileSync("test_marks_raw.txt", "utf8");
let idx = html.indexOf("PREVIOUS SEMESTERS ATTENDANCE");
console.log("Att:", html.substring(Math.max(0, idx - 100), idx + 100));

idx = html.indexOf("PREVIOUS SEMESTERS INTERNAL MARKS");
console.log("Int:", html.substring(Math.max(0, idx - 100), idx + 100));

