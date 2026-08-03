const fs = require("fs");
const file = "D:/aditya_university/backend/src/aec/aec.service.js";
let content = fs.readFileSync(file, "utf8");

const marksCode = `
async function getMarksHistory(username, password) {
    const login = await loginStudent(username, password);
    if (!login.success) return login;
    
    const MARKS_URL = "https://info.aec.edu.in/aec/ajax/Academics_StudentMarksReport,App_Web_studentmarksreport.aspx.a2a1b31c.ashx?_method=ShowMarks&_session=rw";
    
    try {
        const response = await login.client.post(
            MARKS_URL,
            "",
            {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "X-AjaxPro-Method": "ShowMarks"
                }
            }
        );
        let html = response.data;
        if (html.startsWith("'") && html.endsWith("'")) {
            html = html.substring(1, html.length - 1);
        }
        
        html = html.replace(/\\r\\n/g, "\\n").replace(/\\"/g, "\\\"").replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\'/g, "'");
        
        const cheerio = require("cheerio");
        const $ = cheerio.load(html);
        
        let currentSection = null;
        let currentSem = null;

        const result = {
            externalMarks: [],
            previousSemAttendance: [],
            previousSemInternalMarks: []
        };

        $("tr").each((i, tr) => {
            const text = $(tr).text().trim().replace(/\\s+/g, " ");
            
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
        
        return { success: true, marks: result };
    } catch(err) {
        return { success: false, message: err.message };
    }
}
`;

content = content.replace("module.exports = {", marksCode + "\nmodule.exports = {\n    getMarksHistory,");
fs.writeFileSync(file, content);
console.log("Updated aec.service.js");
