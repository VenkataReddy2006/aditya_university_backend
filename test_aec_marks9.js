const fs = require("fs");
const cheerio = require("cheerio");

let html = fs.readFileSync("test_marks_raw.txt", "utf8");
if (html.startsWith("'") && html.endsWith("'")) {
    html = html.substring(1, html.length - 1);
}
html = html.replace(/\\r\\n/g, "\\n").replace(/\\"/g, "\\\"").replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\'/g, "'");

const $ = cheerio.load(html);

const result = {
    externalMarks: [],
    previousSemAttendance: [],
    previousSemInternalMarks: []
};

// 1. Parse External Marks
// It uses spans for semester headings, and tables for marks
$("span.reportHeading2").each((i, span) => {
    const text = $(span).text().trim();
    if (text.includes("Semester")) {
        // It is a semester under EXTERNAL MARKS
        const nextTable = $(span).nextAll("table").first();
        if (nextTable.length > 0) {
            const currentSem = { semester: text, subjects: [] };
            const rows = nextTable.find("tr");
            
            const headers = [];
            $(rows[0]).find("td").each((j, td) => headers.push($(td).text().trim()));
            if (rows.length >= 3) {
                const grades = [];
                const credits = [];
                $(rows[1]).find("td").each((j, td) => grades.push($(td).text().trim()));
                $(rows[2]).find("td").each((j, td) => credits.push($(td).text().trim()));
                for (let k = 1; k < headers.length; k++) {
                    if (headers[k] && headers[k] !== "SGPA") {
                        currentSem.subjects.push({ subject: headers[k], grade: grades[k], credits: credits[k] });
                    } else if (headers[k] === "SGPA") {
                        currentSem.sgpa = grades[k];
                    }
                }
            }
            result.externalMarks.push(currentSem);
        }
    }
});

// 2. Parse Attendance and Internal Marks
let currentSection = null;
let currentSem = null;
$("tr").each((i, tr) => {
    const text = $(tr).text().trim().replace(/\\s+/g, " ");
    if (text === "PREVIOUS SEMESTERS ATTENDANCE") {
        currentSection = "PREVIOUS SEMESTERS ATTENDANCE";
        return;
    } else if (text === "PREVIOUS SEMESTERS INTERNAL MARKS") {
        currentSection = "PREVIOUS SEMESTERS INTERNAL MARKS";
        return;
    }
    
    if ($(tr).hasClass("reportHeading2")) {
        const semText = $(tr).text().trim();
        currentSem = { semester: semText, subjects: [] };
        if (currentSection === "PREVIOUS SEMESTERS ATTENDANCE") {
            result.previousSemAttendance.push(currentSem);
        } else if (currentSection === "PREVIOUS SEMESTERS INTERNAL MARKS") {
            result.previousSemInternalMarks.push(currentSem);
        }
        return;
    }
    
    const innerTable = $(tr).find("table");
    if (innerTable.length > 0 && currentSem) {
        const rows = innerTable.find("tr");
        if (currentSection === "PREVIOUS SEMESTERS ATTENDANCE") {
            const headers = [];
            $(rows[0]).find("td").each((j, td) => headers.push($(td).text().trim()));
            if (rows.length >= 4) {
                const held = [];
                const attend = [];
                const perc = [];
                $(rows[1]).find("td").each((j, td) => held.push($(td).text().trim()));
                $(rows[2]).find("td").each((j, td) => attend.push($(td).text().trim()));
                $(rows[3]).find("td").each((j, td) => perc.push($(td).text().trim()));
                for (let k = 1; k < headers.length; k++) {
                    if (headers[k] && headers[k] !== "Total" && headers[k] !== "") {
                        currentSem.subjects.push({ subject: headers[k], held: held[k], attend: attend[k], percentage: perc[k] });
                    }
                }
            }
        }
        else if (currentSection === "PREVIOUS SEMESTERS INTERNAL MARKS") {
            const headers = [];
            $(rows[0]).find("td").each((j, td) => headers.push($(td).text().trim()));
            
            const marksData = {};
            for (let r = 1; r < rows.length; r++) {
                const rowTds = $(rows[r]).find("td");
                const rowLabel = $(rowTds[0]).text().trim(); 
                
                for (let k = 1; k < headers.length; k++) {
                    if (headers[k]) {
                        if (!marksData[headers[k]]) marksData[headers[k]] = {};
                        marksData[headers[k]][rowLabel] = $(rowTds[k]).text().trim().replace("&nbsp;", "");
                    }
                }
            }
            for (const subject in marksData) {
                currentSem.subjects.push({ subject, marks: marksData[subject] });
            }
        }
    }
});

console.log("External:", result.externalMarks.length);
console.log("Attendance:", result.previousSemAttendance.length);
console.log("Internal:", result.previousSemInternalMarks.length);
