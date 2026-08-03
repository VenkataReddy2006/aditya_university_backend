const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('attendance_page.html'));

console.log("RollNo:", $('#lblRollNo').text().trim());
console.log("Name:", $('#lblStudentName').text().trim());
console.log("Semester:", $('#lblSemester').text().trim());
