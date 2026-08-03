const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('attendance_page.html'));
console.log("Labels:");
$('td').each((i, el) => {
    const txt = $(el).text().trim();
    if (txt.includes('Name') || txt.includes('Roll') || txt.includes('Semester')) {
        console.log("TD:", txt);
        const next = $(el).next().text().trim();
        console.log("Next TD:", next);
    }
});
