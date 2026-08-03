const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('attendance_page.html'));

let name = "";
let rollNumber = "";
let semester = "";

$('td').each((i, el) => {
    const txt = $(el).text().trim();
    if (txt === "Student Name") {
        name = $(el).next().next().text().trim();
    } else if (txt === "RollNo") {
        rollNumber = $(el).next().next().text().trim();
    } else if (txt === "Semester") {
        semester = $(el).next().next().text().trim();
    }
});

console.log({ name, rollNumber, semester });
