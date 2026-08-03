const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('student_dashboard.html'));
console.log($('a').map((i, el) => $(el).text().trim() + ' -> ' + $(el).attr('href')).get().join('\n'));
console.log($('frame, iframe').map((i, el) => $(el).attr('src')).get().join('\n'));
