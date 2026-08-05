const { chromium } = require("playwright");

const LOGIN_URL = "https://examsection.aec.edu.in/Login.aspx";

const GRADE_POINTS = {
    'O': 10,
    'S': 10,
    'A+': 9,
    'A': 9,
    'B+': 8,
    'B': 8,
    'C': 7,
    'D': 6,
    'E': 5,
    'F': 0,
    'AB': 0,
    'RA': 0
};

async function loginToExamPortal(username) {

    console.log("SERVICE CALLED");

    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage();

    try {

        await page.goto(LOGIN_URL, {
            waitUntil: "networkidle"
        });

        await page.waitForLoadState("networkidle");
        await page.click("#lnkLogins");
        await page.waitForSelector("#lnkStudent", { state: 'visible' });

        // Open Student Login
        await page.click("#lnkStudent");
        await page.waitForSelector("#txtUserId", { state: 'visible' });

        await page.fill("#txtUserId", username);
        await page.fill("#txtPwd", username);
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle" }),
            page.click("#btnLogin")
        ]);

        await page.evaluate(() => {
            __doPostBack("ctl00$lnkOverallMarksSemwise", "");
        });

        await page.waitForSelector("input[id^='ctl00_cpStudCorner_btn']");

        console.log("URL =", page.url());

        const allSemesters = [];

        const semesterButtons = await page.locator(
            "input[id^='ctl00_cpStudCorner_btn']"
        ).count();

        console.log("Total Semesters =", semesterButtons);

        for (let sem = 1; sem <= semesterButtons; sem++) {

            console.log("Opening Semester", sem);

            const responsePromise = page.waitForResponse(response => 
                response.url().includes('OverallMarksSemwise.aspx') && response.status() === 200
            );
            
            await page.click(`#ctl00_cpStudCorner_btn${sem}`);
            
            await responsePromise;
            // Add a small 200ms delay to allow DOM to render after response
            await page.waitForTimeout(200);

            const tableData = await page.$$eval(
                "#ctl00_cpStudCorner_grdSemwise tr",
                rows =>
                    rows.map(row =>
                        [...row.querySelectorAll("th,td")].map(td =>
                            td.innerText.trim()
                        )
                    )
            );

            const headers = tableData[0];

            const marks = tableData.slice(1).map(row => {

                const obj = {};

                headers.forEach((header, index) => {

                    if (index === 1) return;

                    obj[header] = row[index];

                });

                return obj;

            });

            let semCredits = 0;
            let semPoints = 0;
            let passedCount = 0;
            let failedCount = 0;

            marks.forEach(subject => {
                let creditStr = subject['Credits'];
                let grade = subject['Grade'] ? subject['Grade'].toUpperCase() : '';
                let status = subject['Status'] ? subject['Status'].toUpperCase() : '';

                if (status === 'PASS') {
                    passedCount++;
                } else {
                    failedCount++;
                }

                if (creditStr && creditStr !== '--') {
                    let c = parseFloat(creditStr);
                    if (!isNaN(c)) {
                        let gp = GRADE_POINTS[grade] !== undefined ? GRADE_POINTS[grade] : 0;
                        semCredits += c;
                        semPoints += (c * gp);
                    }
                }
            });

            let sgpa = semCredits > 0 ? (semPoints / semCredits) : 0;

            allSemesters.push({
                semester: sem,
                sgpa: parseFloat(sgpa.toFixed(2)),
                credits: semCredits,
                subjectsCount: marks.length,
                passed: passedCount,
                failed: failedCount,
                subjects: marks
            });

        }

        let totalCredits = 0;
        let totalPoints = 0;
        let totalBacklogs = 0;

        allSemesters.forEach(s => {
            totalCredits += s.credits;
            totalBacklogs += s.failed;
            totalPoints += (s.sgpa * s.credits);
        });

        let cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;

        return {
            success: true,
            data: {
                cgpa: parseFloat(cgpa.toFixed(2)),
                totalCredits,
                backlogs: totalBacklogs,
                semesters: allSemesters
            }
        };

    } finally {

        await browser.close();

    }
}

module.exports = {
    loginToExamPortal
};