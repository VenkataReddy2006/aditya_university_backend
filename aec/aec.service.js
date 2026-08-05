const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { encryptPassword } = require("../shared/utils/encryption");
const { parse } = require("node-html-parser");

const LOGIN_URL = "https://info.aec.edu.in/aec/default.aspx";
const ATTENDANCE_URL =
    "https://info.aec.edu.in/aec/Academics/studentattendance.aspx/ShowAttendance";

async function loginStudent(username, password) {
    try {

        const jar = new CookieJar();

        const client = wrapper(
            axios.create({
                jar,
                withCredentials: true,
                maxRedirects: 10,
                validateStatus: () => true,
            })
        );

        // LOGIN PAGE
        const loginPage = await client.get(LOGIN_URL);

        const $ = cheerio.load(loginPage.data);

        const encrypted = encryptPassword(password);

        const form = {
            __VIEWSTATE: $("#__VIEWSTATE").val(),
            __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").val(),
            __VIEWSTATEENCRYPTED: $("#__VIEWSTATEENCRYPTED").val() || "",
            __EVENTVALIDATION: $("#__EVENTVALIDATION").val(),

            txtId1: "",
            txtPwd1: encrypted,

            txtId2: username,
            txtPwd2: encrypted,

            txtId3: "",
            txtPwd3: "",

            hdnpwd1: encrypted,
            hdnpwd2: encrypted,
            hdnpwd3: "",

            hdnDPToken: $("#hdnDPToken").val(),

            "imgBtn2.x": 33,
            "imgBtn2.y": 22
        };

        await client.post(
            LOGIN_URL,
            qs.stringify(form),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Origin: "https://info.aec.edu.in",
                    Referer: LOGIN_URL
                }
            }
        );

        const cookies = client.defaults.jar.getCookieStringSync(LOGIN_URL);
        
        if (!cookies.includes("frmAuth")) {
            return {
                success: false,
                message: "Invalid username or password"
            };
        }

        return {
            success: true,
            client
        };

    } catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

async function getAttendance(username, password, fromDate = "", toDate = "") {

    const login = await loginStudent(username, password);

    if (!login.success) {
        return login;
    }

    const client = login.client;

    const response = await client.post(
        ATTENDANCE_URL,
        {
            fromDate: fromDate,
            toDate: toDate,
            excludeothersubjects: false
        },
        {
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            }
        }
    );

    const html = response.data.d;
    if (!html) {
        return {
            success: false,
            message: "Failed to parse attendance data from server."
        };
    }

    const root = parse(html);

    const tables = root.querySelectorAll("table");

    const studentTable = tables[1];
    const attendanceTable = tables[2];

    // ---------- Student Details ----------

    const studentText = studentTable.text;

    const student = {
        rollNo: studentText.match(/RollNo:([A-Z0-9]+)Student/i)?.[1]?.trim(),

        name: studentText.match(/Student Name:(.*?)Course/i)?.[1]?.trim(),

        course: studentText.match(/Course:(.*?)Branch/i)?.[1]?.trim(),

        branch: studentText.match(/Branch:(.*?)Semester/i)?.[1]?.trim(),

        semester: studentText.match(/Semester:(.*)$/i)?.[1]?.trim()
    };

    // ---------- Attendance ----------

    const rows = attendanceTable.querySelectorAll("tr");

    const attendance = [];

    for (let i = 1; i < rows.length - 1; i++) {

        const td = rows[i].querySelectorAll("td");

        if (td.length < 5) continue;

        attendance.push({
            subject: td[1].text.trim(),
            held: Number(td[2].text.trim()),
            attended: Number(td[3].text.trim()),
            percentage: Number(td[4].text.trim())
        });

    }

    const total = rows[rows.length - 1].querySelectorAll("td");

    const overall = {
        held: Number(total[1].text.trim()),
        attended: Number(total[2].text.trim()),
        percentage: Number(total[3].text.trim())
    };

    return {
        success: true,
        student,
        overall,
        attendance
    };

}

async function getProfile(username, password) {
    const login = await loginStudent(username, password);
    if (!login.success) return login;
    
    const client = login.client;
    
    const PROFILE_URL = "https://info.aec.edu.in/aec/ajax/StudentProfile,App_Web_studentprofile.aspx.a2a1b31c.ashx?_method=ShowStudentProfileNew&_session=rw";
    
    const response = await client.post(
        PROFILE_URL,
        `RollNo="${username}"\r\nisImageDisplay=true`,
        {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-AjaxPro-Method": "ShowStudentProfileNew"
            }
        }
    );
    
    let html = response.data;
    if (!html) {
        return { success: false, message: "Failed to load profile data." };
    }
    
    if (html.startsWith("'") && html.endsWith("'")) {
        html = html.substring(1, html.length - 1);
    }
    html = html.replace(/\\'/g, "'").replace(/\\r\\n/g, "\n");
    
    const $ = cheerio.load(html);
    const bioData = $("#divProfile_BioData");
    
    function getVal(key) {
        let val = "";
        bioData.find("td").each((i, td) => {
            if ($(td).text().trim() === key) {
                val = $(td).next().next().text().trim();
            }
        });
        return val;
    }
    
    const student = {
        photo: `http://localhost:3000/api/aec/image/${username}.jpg`,
        admissionNo: getVal("Admission.No"),
        rollNo: getVal("RollNo"),
        name: getVal("Name"),
        course: getVal("Course"),
        branch: getVal("Branch"),
        semester: getVal("Semester"),
        gender: getVal("Gender"),
        dob: getVal("DOB"),
        nationality: getVal("Nationality"),
        religion: getVal("Religion"),
        sscMarks: getVal("SSC Marks, %"),
        interMarks: getVal("Inter Marks, %"),
        sscGrade: getVal("SSC Gradepoints"),
        interGrade: getVal("Inter Gradepoints"),
        entranceType: getVal("Entrance Type"),
        rank: getVal("EAMCET/ECET Rank"),
        seatType: getVal("Seat Type"),
        caste: getVal("Caste"),
        lastStudied: getVal("Last Studied"),
        joiningDate: getVal("Joining Date"),
        mobile: getVal("Mobile.No"),
        email: getVal("Email"),
        bankAccount: getVal("Bank A/C.No"),
        aadhaar: getVal("Adhar.No"),
        rationCard: getVal("Ration Card.No"),
        
        fatherName: getVal("Father Name"),
        motherName: getVal("Mother Name"),
        fatherMobile: getVal("Father Mobile.No"),
        motherMobile: getVal("Mother Mobile.No"),
        fatherOccupation: "",
        motherOccupation: "",
        annualIncome: getVal("Annual Income"),
        
        correspondenceAddress: getVal("Correspondence Address"),
        permanentAddress: getVal("Permanent Address")
    };
    
    let occupations = [];
    bioData.find("td").each((i, td) => {
        if ($(td).text().trim() === "Occupation") {
            occupations.push($(td).next().next().text().trim());
        }
    });
    if (occupations.length >= 2) {
        student.fatherOccupation = occupations[0];
        student.motherOccupation = occupations[1];
    }
    
    // Fix Name overriding from Guardian details
    let names = [];
    bioData.find("td").each((i, td) => {
        if ($(td).text().trim() === "Name") {
            names.push($(td).next().next().text().trim());
        }
    });
    if (names.length >= 1) {
        student.name = names[0];
    }
    
    return {
        success: true,
        profile: student
    };
}

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

async function getTodayAttendance(username, password) {
    const today = formatDate(new Date());
    return await getAttendance(username, password, today, today);
}


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
        
        html = html.replace(/\\r\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\'/g, "'");
        
        const cheerio = require("cheerio");
        const $ = cheerio.load(html);
        
        let currentSection = null;
        let currentSem = null;

        const result = {
            externalMarks: [],
            previousSemAttendance: [],
            previousSemInternalMarks: []
        };

        // 1. Parse External Marks
        $("span.reportHeading2").each((i, span) => {
            const text = $(span).text().trim();
            if (text.includes("Semester")) {
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
        $("tr").each((i, tr) => {
            const text = $(tr).text().trim().replace(/\s+/g, " ");
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
        
        return { success: true, marks: result };
    } catch(err) {
        return { success: false, message: err.message };
    }
}

module.exports = {
    getMarksHistory,
    loginStudent,
    getAttendance,
    getTodayAttendance,
    getProfile
};
