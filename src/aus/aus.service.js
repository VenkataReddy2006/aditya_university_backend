const axios = require("axios");
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);
const cheerio = require("cheerio");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { parse } = require("node-html-parser");

const LOGIN_URL = "https://info.aec.edu.in/aus/default.aspx";
const ATTENDANCE_URL =
    "https://info.aec.edu.in/aus/Academics/studentattendance.aspx/ShowAttendance";

async function loginStudent(username, password) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        });
        const page = await context.newPage();
        await page.goto(LOGIN_URL, { waitUntil: "networkidle" });
        await page.fill("#txtUserId", username);
        await page.fill("#txtPassword", password);
        for (let i = 0; i < 5; i++) {
            await page.waitForTimeout(1000);
            let token = await page.$eval("[name=cf-turnstile-response]", el => el.value).catch(() => "");
            if (token) break;
        }
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
            page.click("#btnLogin")
        ]);
        if (page.url().toLowerCase().includes("default.aspx")) {
            await browser.close();
            return { success: false, requires_webview: true, message: "Cloudflare Turnstile blocked backend login. WebView required." };
        }
        const pageCookies = await context.cookies();
        await browser.close();
        const sessionCookie = pageCookies.find(ck => ck.name === "ASP.NET_SessionId");
        if (!sessionCookie) { return { success: false, requires_webview: true, message: "No session cookie found" }; }
        return loginWithCookie(sessionCookie.value);
    } catch (err) {
        if (browser) await browser.close();
        return { success: false, requires_webview: true, error: err.message };
    }
}

function loginWithCookie(cookieString, userAgent) {
    const jar = new CookieJar();
    const cookies = cookieString.split(';');
    for (let c of cookies) {
        if (c.trim()) {
            jar.setCookieSync(c.trim(), "https://info.aec.edu.in");
        }
    }
    const client = wrapper(axios.create({ 
        jar, 
        withCredentials: true, 
        maxRedirects: 10, 
        validateStatus: () => true,
        headers: {
            "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    }));
    return { success: true, client };
}

async function getAttendance(username, password, fromDate = "", toDate = "", cookieClient = null) {
    let client;
    if (cookieClient) { client = cookieClient; } else {
        const login = await loginStudent(username, password);
        if (!login.success) return login;
        client = login.client;
    }

    const pageRes = await client.get("https://info.aec.edu.in/aus/StudentAttendanceDetails.aspx");
    const match = pageRes.data.match(/ajax\/StudentAttendanceDetails,App_Web_studentattendancedetails[^"']+/i);
    let ATTENDANCE_URL = "https://info.aec.edu.in/aus/ajax/StudentAttendanceDetails,App_Web_studentattendancedetails.aspx.a2a1b31c.ashx?_method=GetStudentAttendanceSemwisedetails&_session=rw";
    if (match) {
        ATTENDANCE_URL = "https://info.aec.edu.in/aus/" + match[0] + "?_method=GetStudentAttendanceSemwisedetails&_session=rw";
    }

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
    const studentText = studentTable.text;
    const student = {
        rollNo: studentText.match(/RollNo:([A-Z0-9]+)Student/i)?.[1]?.trim(),
        name: studentText.match(/Student Name:(.*?)Course/i)?.[1]?.trim(),
        course: studentText.match(/Course:(.*?)Branch/i)?.[1]?.trim(),
        branch: studentText.match(/Branch:(.*?)Semester/i)?.[1]?.trim(),
        semester: studentText.match(/Semester:(.*)$/i)?.[1]?.trim()
    };

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

    return { success: true, student, overall, attendance };
}

async function getProfile(username, password, cookieClient = null) {
    let client;
    if (cookieClient) { client = cookieClient; } else {
        const login = await loginStudent(username, password);
        if (!login.success) return login;
        client = login.client;
    }

    // FIRST: fetch StudentProfile.aspx to get the correct AjaxPro hash
    const pageRes = await client.get("https://info.aec.edu.in/aus/StudentProfile.aspx");
    const match = pageRes.data.match(/ajax\/StudentProfile,App_Web_studentprofile[^"']+/i);
    let PROFILE_URL = "https://info.aec.edu.in/aus/ajax/StudentProfile,App_Web_studentprofile.aspx.a2a1b31c.ashx?_method=ShowStudentProfileNew&_session=rw";
    if (match) {
        PROFILE_URL = "https://info.aec.edu.in/aus/" + match[0] + "?_method=ShowStudentProfileNew&_session=rw";
    }

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
    
    // DEBUG: Dump html to a file to see what it actually is
    try {
        require('fs').writeFileSync('aus_profile_debug.html', html);
        console.log("Dumped aus_profile_debug.html");
    } catch(e) {}

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
        photo: `http://localhost:3000/api/aus/image/${username}.jpg`,
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

    let names = [];
    bioData.find("td").each((i, td) => {
        if ($(td).text().trim() === "Name") {
            names.push($(td).next().next().text().trim());
        }
    });
    if (names.length >= 1) {
        student.name = names[0];
    }

    return { success: true, profile: student };
}

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

async function getTodayAttendance(username, password, cookieClient = null) {
    const today = formatDate(new Date());
    return await getAttendance(username, password, today, today, cookieClient);
}

async function getMarksHistory(username, password, cookieClient = null) {
    let client;
    if (cookieClient) { client = cookieClient; } else {
        const login = await loginStudent(username, password);
        if (!login.success) return login;
        client = login.client;
    }

    const pageRes = await client.get("https://info.aec.edu.in/aus/Academics_StudentMarksReport.aspx");
    const match = pageRes.data.match(/ajax\/Academics_StudentMarksReport,App_Web_studentmarksreport[^"']+/i);
    let MARKS_URL = "https://info.aec.edu.in/aus/ajax/Academics_StudentMarksReport,App_Web_studentmarksreport.aspx.a2a1b31c.ashx?_method=ShowMarks&_session=rw";
    if (match) {
        MARKS_URL = "https://info.aec.edu.in/aus/" + match[0] + "?_method=ShowMarks&_session=rw";
    }

    try {
        const response = await client.post(
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
        html = html.replace(/\\r\\n/g, "\n").replace(/\\"/g, '"').replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\'/g, "'");

        const $2 = cheerio.load(html);
        let currentSection = null;
        let currentSem = null;
        const result = { externalMarks: [], previousSemAttendance: [], previousSemInternalMarks: [] };

        $2("span.reportHeading2").each((i, span) => {
            const text = $2(span).text().trim();
            if (text.includes("Semester")) {
                const nextTable = $2(span).nextAll("table").first();
                if (nextTable.length > 0) {
                    const sem = { semester: text, subjects: [] };
                    const rows = nextTable.find("tr");
                    const headers = [];
                    $2(rows[0]).find("td").each((j, td) => headers.push($2(td).text().trim()));
                    if (rows.length >= 3) {
                        const grades = [], credits = [];
                        $2(rows[1]).find("td").each((j, td) => grades.push($2(td).text().trim()));
                        $2(rows[2]).find("td").each((j, td) => credits.push($2(td).text().trim()));
                        for (let k = 1; k < headers.length; k++) {
                            if (headers[k] && headers[k] !== "SGPA") {
                                sem.subjects.push({ subject: headers[k], grade: grades[k], credits: credits[k] });
                            } else if (headers[k] === "SGPA") { sem.sgpa = grades[k]; }
                        }
                    }
                    result.externalMarks.push(sem);
                }
            }
        });

        $2("tr").each((i, tr) => {
            const text = $2(tr).text().trim().replace(/\s+/g, " ");
            if (text === "PREVIOUS SEMESTERS ATTENDANCE") { currentSection = "PREVIOUS SEMESTERS ATTENDANCE"; return; }
            else if (text === "PREVIOUS SEMESTERS INTERNAL MARKS") { currentSection = "PREVIOUS SEMESTERS INTERNAL MARKS"; return; }

            if ($2(tr).hasClass("reportHeading2")) {
                const semText = $2(tr).text().trim();
                currentSem = { semester: semText, subjects: [] };
                if (currentSection === "PREVIOUS SEMESTERS ATTENDANCE") result.previousSemAttendance.push(currentSem);
                else if (currentSection === "PREVIOUS SEMESTERS INTERNAL MARKS") result.previousSemInternalMarks.push(currentSem);
                return;
            }

            const innerTable = $2(tr).find("table");
            if (innerTable.length > 0 && currentSem) {
                const rows = innerTable.find("tr");
                if (currentSection === "PREVIOUS SEMESTERS ATTENDANCE") {
                    const headers = [];
                    $2(rows[0]).find("td").each((j, td) => headers.push($2(td).text().trim()));
                    if (rows.length >= 4) {
                        const held = [], attend = [], perc = [];
                        $2(rows[1]).find("td").each((j, td) => held.push($2(td).text().trim()));
                        $2(rows[2]).find("td").each((j, td) => attend.push($2(td).text().trim()));
                        $2(rows[3]).find("td").each((j, td) => perc.push($2(td).text().trim()));
                        for (let k = 1; k < headers.length; k++) {
                            if (headers[k] && headers[k] !== "Total" && headers[k] !== "") {
                                currentSem.subjects.push({ subject: headers[k], held: held[k], attend: attend[k], percentage: perc[k] });
                            }
                        }
                    }
                } else if (currentSection === "PREVIOUS SEMESTERS INTERNAL MARKS") {
                    const headers = [];
                    $2(rows[0]).find("td").each((j, td) => headers.push($2(td).text().trim()));
                    const marksData = {};
                    for (let r = 1; r < rows.length; r++) {
                        const rowTds = $2(rows[r]).find("td");
                        const rowLabel = $2(rowTds[0]).text().trim();
                        for (let k = 1; k < headers.length; k++) {
                            if (headers[k]) {
                                if (!marksData[headers[k]]) marksData[headers[k]] = {};
                                marksData[headers[k]][rowLabel] = $2(rowTds[k]).text().trim().replace("&nbsp;", "");
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
    } catch (err) {
        return { success: false, message: err.message };
    }
}

module.exports = {
    loginWithCookie,
    getMarksHistory,
    loginStudent,
    getAttendance,
    getTodayAttendance,
    getProfile
};
