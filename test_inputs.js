const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('after_student_login.html'));
console.log("Input IDs:", $('input').map((i, el) => $(el).attr('id')).get().join(', '));
