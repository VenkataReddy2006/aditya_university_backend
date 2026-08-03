const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('output.html', 'utf8');
const $ = cheerio.load(html);
const controls = [];
$('input, select, table').each((i, el) => {
    controls.push({
        tag: el.tagName.toUpperCase(),
        id: el.attribs.id,
        name: el.attribs.name
    });
});
console.log(JSON.stringify(controls, null, 2));
