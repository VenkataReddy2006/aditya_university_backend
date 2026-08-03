
const fs = require("fs");
const cheerio = require("cheerio");
const html = fs.readFileSync("aec_marks_actual.html", "utf8");
const $ = cheerio.load(html);

// Find the headers to locate sections
let externalMarksTable = null;
let attendanceTable = null;
let internalMarksTable = null;

$("td").each((i, td) => {
    const text = $(td).text().trim();
    if (text === "EXTERNAL MARKS") {
        externalMarksTable = $(td).closest("table");
    } else if (text === "PREVIOUS SEMESTERS ATTENDANCE") {
        attendanceTable = $(td).closest("table");
    } else if (text === "PREVIOUS SEMESTERS INTERNAL MARKS") {
        internalMarksTable = $(td).closest("table");
    }
});

function parseExternalMarks(tableEl) {
    if (!tableEl) return [];
    const semesters = [];
    let currentSem = null;
    
    $(tableEl).find("tr").each((i, tr) => {
        const h2 = $(tr).find("td.reportHeading2");
        if (h2.length > 0) {
            // New Semester
            currentSem = { semester: h2.text().trim(), subjects: [] };
            semesters.push(currentSem);
            return;
        }
        
        // Find inner tables
        const innerTable = $(tr).find("table");
        if (innerTable.length > 0 && currentSem) {
            const trs = innerTable.find("tr");
            const headers = [];
            $(trs[0]).find("td").each((j, td) => headers.push($(td).text().trim()));
            
            // row 1: Grade, row 2: Credits, (or maybe row 0 is headers)
            // Let us dump what it looks like
            if (trs.length >= 3) {
                const grades = [];
                const credits = [];
                $(trs[1]).find("td").each((j, td) => grades.push($(td).text().trim()));
                $(trs[2]).find("td").each((j, td) => credits.push($(td).text().trim()));
                
                for (let k = 1; k < headers.length; k++) {
                    if (headers[k] && headers[k] !== "SGPA") {
                        currentSem.subjects.push({
                            subject: headers[k],
                            grade: grades[k],
                            credits: credits[k]
                        });
                    } else if (headers[k] === "SGPA") {
                        currentSem.sgpa = grades[k];
                    }
                }
            }
        }
    });
    return semesters;
}

const ext = parseExternalMarks(externalMarksTable);
console.log(JSON.stringify(ext, null, 2));


