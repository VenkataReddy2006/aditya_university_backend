const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('overall_marks.html'));
$('a').each((i, el) => {
    if ($(el).text().includes('I SEMESTER')) {
        console.log($.html(el));
    }
});
