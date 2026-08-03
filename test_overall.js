const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('overall_marks.html'));
console.log($('a').map((i, el) => $(el).text().trim()).get().join('\n').substring(0, 500));
