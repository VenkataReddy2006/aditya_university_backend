const { chromium } = require("playwright");
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { encryptPassword } = require("../shared/utils/encryption");

async function loginAndGetPage(username, password) {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto("https://info.aec.edu.in/acet/default.aspx");
        
        let loginError = null;
        page.on('dialog', async dialog => {
            loginError = dialog.message();
            await dialog.accept();
        });

        await page.fill("#txtId2", username);
        await page.fill("#txtPwd2", password);
        await page.evaluate(() => encryptJSText(2));
        try {
            await Promise.all([
                page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }),
                page.click("#imgBtn2")
            ]);
        } catch (err) {
            // If it timed out, it might be because a dialog popped up and prevented navigation
            if (loginError) {
                throw new Error(loginError);
            }
            throw err;
        }
        
        if (loginError) {
            throw new Error(loginError);
        }

        if (page.url().includes("default.aspx")) {
            throw new Error("Invalid username or password");
        }
        
        return { browser, page };
    } catch (e) {
        await browser.close();
        throw e;
    }
}

async function login(username, password) {
    try {
        const { browser } = await loginAndGetPage(username, password);
        await browser.close();
        return { success: true };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

async function getProfile(username, password) {
    let _browser;
    try {
        const { browser, page } = await loginAndGetPage(username, password);
        _browser = browser;

        const iframeElement = await page.$('#capIframeId');
        const frame = await iframeElement.contentFrame();
        
        const profile = await frame.evaluate(() => {
            const data = {};
            const tds = Array.from(document.querySelectorAll('td'));

            function getValueByLabel(label, index = 0) {
                const matches = tds.filter(td => td.textContent.trim() === label);
                if (matches[index]) {
                    let next = matches[index].nextElementSibling;
                    if (next && next.textContent.trim() === ':') {
                        next = next.nextElementSibling;
                    }
                    return next ? next.textContent.trim() : '';
                }
                return '';
            }

            data.admissionNo = getValueByLabel('Admission.No');
            data.rollNo = getValueByLabel('RollNo');
            data.name = getValueByLabel('Name');
            data.course = getValueByLabel('Course');
            data.branch = getValueByLabel('Branch');
            data.semester = getValueByLabel('Semester');
            data.gender = getValueByLabel('Gender');
            data.dob = getValueByLabel('DOB');
            data.nationality = getValueByLabel('Nationality');
            data.religion = getValueByLabel('Religion');
            
            data.sscMarks = getValueByLabel('SSC Marks, %');
            data.interMarks = getValueByLabel('Inter Marks, %');
            data.sscGrade = getValueByLabel('SSC Gradepoints');
            data.interGrade = getValueByLabel('Inter Gradepoints');
            data.entranceType = getValueByLabel('Entrance Type');
            data.rank = getValueByLabel('EAMCET/ECET Rank');
            data.seatType = getValueByLabel('Seat Type');
            data.caste = getValueByLabel('Caste');
            data.lastStudied = getValueByLabel('Last Studied');
            data.joiningDate = getValueByLabel('Joining Date');

            data.mobile = getValueByLabel('Mobile.No');
            data.email = getValueByLabel('Email');
            data.bankAccount = getValueByLabel('Bank A/C.No');
            data.aadhaar = getValueByLabel('Adhar.No');
            data.rationCard = getValueByLabel('Ration Card.No');
            data.transportHalt = getValueByLabel('Transport Halt');
            
            data.fatherName = getValueByLabel('Father Name');
            data.motherName = getValueByLabel('Mother Name');
            data.fatherOccupation = getValueByLabel('Occupation', 0);
            data.motherOccupation = getValueByLabel('Occupation', 1);
            
            data.fatherMobile = getValueByLabel('Father Mobile.No');
            data.motherMobile = getValueByLabel('Mother Mobile.No');
            data.annualIncome = getValueByLabel('Annual Income');
            
            data.correspondenceAddress = getValueByLabel('Correspondence Address');
            data.permanentAddress = getValueByLabel('Permanent Address');

            if (data.correspondenceAddress) data.correspondenceAddress = data.correspondenceAddress.replace(/\s+/g, ' ').trim();
            if (data.permanentAddress) data.permanentAddress = data.permanentAddress.replace(/\s+/g, ' ').trim();

            return data;
        });
        return { success: true, profile };
    } catch (e) {
        return { success: false, message: e.message };
    } finally {
        if (_browser) await _browser.close();
    }
}

async function loginStudentAxios(username, password) {
    try {
        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar, withCredentials: true, maxRedirects: 10, validateStatus: () => true }));
        const LOGIN_URL = "https://info.aec.edu.in/acet/default.aspx";
        const loginPage = await client.get(LOGIN_URL);
        const $ = cheerio.load(loginPage.data);
        const encrypted = encryptPassword(password);
        
        const form = {
            __VIEWSTATE: $("#__VIEWSTATE").val(),
            __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").val(),
            __VIEWSTATEENCRYPTED: $("#__VIEWSTATEENCRYPTED").val() || "",
            __EVENTVALIDATION: $("#__EVENTVALIDATION").val(),
            txtId1: "", txtPwd1: encrypted,
            txtId2: username, txtPwd2: encrypted,
            txtId3: "", txtPwd3: "",
            hdnpwd1: encrypted, hdnpwd2: encrypted, hdnpwd3: "",
            hdnDPToken: $("#hdnDPToken").val(),
            "imgBtn2.x": 33, "imgBtn2.y": 22
        };

        await client.post(LOGIN_URL, qs.stringify(form), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Origin: "https://info.aec.edu.in",
                Referer: LOGIN_URL
            }
        });

        const cookies = client.defaults.jar.getCookieStringSync(LOGIN_URL);
        if (!cookies.includes("frmAuth")) {
            return { success: false, message: "Invalid username or password" };
        }
        return { success: true, client };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function getMarksHistory(username, password) {
    const login = await loginStudentAxios(username, password);
    if (!login.success) return login;
    
    const pageRes = await login.client.get("https://info.aec.edu.in/acet/Academics_StudentMarksReport.aspx");
    const match = pageRes.data.match(/ajax\/Academics_StudentMarksReport,App_Web_studentmarksreport[^"']+/i);
    let MARKS_URL = "https://info.aec.edu.in/acet/ajax/Academics_StudentMarksReport,App_Web_studentmarksreport.aspx.a2a1b31c.ashx?_method=ShowMarks&_session=rw";
    if (match) {
        MARKS_URL = "https://info.aec.edu.in/acet/" + match[0] + "?_method=ShowMarks&_session=rw";
    }
    
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
        if (html.startsWith("\'") && html.endsWith("\'")) {
            html = html.substring(1, html.length - 1);
        }
        
        html = html.replace(/\\r\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\'/g, "'");
        
        const $ = cheerio.load(html);
        
        let currentSection = null;
        let currentSem = null;

        const result = {
            externalMarks: [],
            previousSemAttendance: [],
            previousSemInternalMarks: []
        };

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

module.exports = { login, getProfile, loginAndGetPage, getMarksHistory };
