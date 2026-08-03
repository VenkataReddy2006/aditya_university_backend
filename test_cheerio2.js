
const fs = require("fs");
const cheerio = require("cheerio");
const html = fs.readFileSync("aec_marks_actual.html", "utf8");
const $ = cheerio.load(html);

// Since all might be in one giant table, let us just iterate over ALL tr elements 
// and maintain a state of what section we are in.

let currentSection = null;
let currentSem = null;

const result = {
    externalMarks: [],
    previousSemAttendance: [],
    previousSemInternalMarks: []
};

$("tr").each((i, tr) => {
    // 1. Check if it is a main section header (e.g. EXTERNAL MARKS)
    // Often these are centered with strong text, or just plain text in a td.
    const text = $(tr).text().trim().replace(/\s+/g, " ");
    
    if (text === "EXTERNAL MARKS") {
        currentSection = "EXTERNAL MARKS";
        return;
    } else if (text === "PREVIOUS SEMESTERS ATTENDANCE") {
        currentSection = "PREVIOUS SEMESTERS ATTENDANCE";
        return;
    } else if (text === "PREVIOUS SEMESTERS INTERNAL MARKS") {
        currentSection = "PREVIOUS SEMESTERS INTERNAL MARKS";
        return;
    }
    
    // 2. Check if it is a Semester header (e.g. "I Semester", "II Semester")
    if ($(tr).hasClass("reportHeading2")) {
        const semText = $(tr).text().trim();
        currentSem = { semester: semText, subjects: [] };
        
        if (currentSection === "EXTERNAL MARKS") {
            result.externalMarks.push(currentSem);
        } else if (currentSection === "PREVIOUS SEMESTERS ATTENDANCE") {
            result.previousSemAttendance.push(currentSem);
        } else if (currentSection === "PREVIOUS SEMESTERS INTERNAL MARKS") {
            result.previousSemInternalMarks.push(currentSem);
        }
        return;
    }
    
    // 3. Extract the inner table if we are inside a semester
    const innerTable = $(tr).find("table");
    if (innerTable.length > 0 && currentSem) {
        const rows = innerTable.find("tr");
        
        if (currentSection === "EXTERNAL MARKS") {
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
        } 
        else if (currentSection === "PREVIOUS SEMESTERS ATTENDANCE") {
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
                    if (headers[k] && headers[k] !== "Total") {
                        currentSem.subjects.push({ subject: headers[k], held: held[k], attend: attend[k], percentage: perc[k] });
                    }
                }
            }
        }
        else if (currentSection === "PREVIOUS SEMESTERS INTERNAL MARKS") {
            const headers = [];
            $(rows[0]).find("td").each((j, td) => headers.push($(td).text().trim()));
            
            // For internal marks, rows 1..N are Desc-I, Asg-I, Obj-I, etc.
            const marksData = {};
            for (let r = 1; r < rows.length; r++) {
                const rowTds = $(rows[r]).find("td");
                const rowLabel = $(rowTds[0]).text().trim(); // Desc-I, etc.
                
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

console.log(JSON.stringify(result, null, 2));


