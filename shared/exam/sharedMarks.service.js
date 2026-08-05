const cheerio = require("cheerio");
const { loginExamPortal } = require("./examLogin.service");

async function getSemesters(username, college) {
    let browser;

    try {
        const result = await loginExamPortal(username, college);

        browser = result.browser;
        const page = result.page;

        // Open Marks Details
        await page.click("text=Marks Details");
        await page.waitForTimeout(2000);

        // Open Overall Marks
        await page.evaluate(() => {
            __doPostBack('ctl00$lnkOverallMarksSemwise', '');
        });

        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        const html = await page.content();
        const $ = cheerio.load(html);

        const semesters = [];
        
        $("input[type=submit][id^=ctl00_cpStudCorner_btn]").each((index, el) => {
            semesters.push({
                id: $(el).attr("id"),
                name: $(el).attr("value"),
                subjects: []
            });
        });

        // Fetch marks for each semester
        for (let i = 0; i < semesters.length; i++) {
            const sem = semesters[i];
            
            await page.click(`#${sem.id}`);
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(1500); // Wait for grid to load

            const semHtml = await page.content();
            const sem$ = cheerio.load(semHtml);
            
            const subjects = [];
            sem$("#ctl00_cpStudCorner_grdSemwise tbody tr").each((index, row) => {
                const tds = sem$(row).find("td");
                if (tds.length >= 8) {
                    subjects.push({
                        courseCode: sem$(tds[2]).text().trim(),
                        courseName: sem$(tds[3]).text().trim(),
                        monthYear: sem$(tds[4]).text().trim(),
                        grade: sem$(tds[5]).text().trim(),
                        credits: sem$(tds[6]).text().trim(),
                        status: sem$(tds[7]).text().trim()
                    });
                }
            });
            
            sem.subjects = subjects;
        }

        return {
            success: true,
            semesters
        };

    } finally {
        if (browser)
            await browser.close();
    }
}

async function getMarks(username, college, semesterId) {
    let browser;

    try {
        const result = await loginExamPortal(username, college);

        browser = result.browser;
        const page = result.page;

        // Open Marks Details
        await page.click("text=Marks Details");
        await page.waitForTimeout(2000);

        // Open Overall Marks
        await page.evaluate(() => {
            __doPostBack('ctl00$lnkOverallMarksSemwise', '');
        });

        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        // Extract the semester name before clicking it so we can return it
        const htmlBeforeClick = await page.content();
        const $before = cheerio.load(htmlBeforeClick);
        const semesterName = $before(`#${semesterId}`).attr("value") || "UNKNOWN SEMESTER";

        // Click dynamic semester
        await page.click(`#${semesterId}`);

        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(3000);

        const html = await page.content();
        const $ = cheerio.load(html);

        const subjects = [];

        $("#ctl00_cpStudCorner_grdSemwise tbody tr").each((index, row) => {
            const tds = $(row).find("td");
            if (tds.length >= 8) {
                subjects.push({
                    courseCode: $(tds[2]).text().trim(),
                    courseName: $(tds[3]).text().trim(),
                    monthYear: $(tds[4]).text().trim(),
                    grade: $(tds[5]).text().trim(),
                    credits: $(tds[6]).text().trim(),
                    status: $(tds[7]).text().trim()
                });
            }
        });

        return {
            success: true,
            semester: semesterName,
            subjects
        };

    } finally {
        if (browser)
            await browser.close();
    }
}

module.exports = {
    getSemesters,
    getMarks
};
