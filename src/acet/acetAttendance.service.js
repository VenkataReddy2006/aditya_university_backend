const cheerio = require("cheerio");
const { loginAndGetPage } = require("./acet.service");

async function getAttendance(username, password, fromDate = "", toDate = "") {
    let _browser;
    try {
        const { browser, page } = await loginAndGetPage(username, password);
        _browser = browser;

        await page.click('text="ATTENDANCE"');
        await page.waitForTimeout(3000);

        console.log(await page.frames().map(f => f.url()));

        const frames = page.frames();

        frames.forEach((f, i) => {
            console.log(i, f.url());
        });

        const frame = frames.find(f =>
            f.url().includes("StudentAttendance.aspx")
        );

        console.log("Selected Frame:", frame.url());

        console.log(await frame.$("#btnShow"));

        await frame.waitForSelector("#btnShow", {
            state: "visible",
            timeout: 20000
        });

        page.on("request", request => {
            if (request.url().includes("ShowAttendance")) {
                console.log("REQUEST:", request.url());
                console.log("POST DATA:", request.postData());
            }
        });

        page.on("response", async response => {
            if (response.url().includes("ShowAttendance")) {
                console.log("STATUS:", response.status());
                console.log(await response.text());
            }
        });

        console.log("Before Click");
        await frame.waitForSelector("#radTillNow");
        
        if (fromDate && toDate) {
            await frame.check("#radPeriod");
            await frame.fill("#txtFromDate", fromDate);
            await frame.fill("#txtToDate", toDate);
        } else {
            await frame.check("#radTillNow");
        }
        
        await page.waitForTimeout(1000);
        await frame.click("#btnShow");
        console.log("After Click");

        console.log("Waiting...");
        await page.waitForTimeout(10000);
        console.log("Done waiting");

        const exists = await frame.$("#divReport");
        console.log("divReport =", exists);

        const html = await frame.content();

        require("fs").writeFileSync("attendance_page.html", html);

        console.log("Saved attendance_page.html");
        const report = html;

        if (!report) {
            return { success: false, message: "No attendance data found" };
        }

        const $ = cheerio.load(report);
        const attendance = [];

        let name = "";
        let rollNumber = "";
        let semester = "";

        $('td').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt === "Student Name") {
                name = $(el).next().next().text().trim();
            } else if (txt === "RollNo") {
                rollNumber = $(el).next().next().text().trim();
            } else if (txt === "Semester") {
                semester = $(el).next().next().text().trim();
            }
        });

        const student = { name, rollNumber, semester };

        $("table.cellBorder tr.reportData1").each((i, row) => {
            const tds = $(row).find("td");

            attendance.push({
                subject: $(tds[1]).text().trim(),
                held: Number($(tds[2]).text().trim()),
                attended: Number($(tds[3]).text().trim()),
                percentage: Number($(tds[4]).text().trim())
            });
        });

        const totalRow = $("table.cellBorder tr.reportHeading2WithBackground").last();
        const totalTds = totalRow.find("td");

        totalTds.each((i, td) => {
            console.log(i, $(td).text().trim());
        });

        const overall = {
            held: Number($(totalTds[1]).text().trim()),
            attended: Number($(totalTds[2]).text().trim()),
            percentage: Number($(totalTds[3]).text().trim())
        };

        return {
            success: true,
            student,
            attendance,
            overall
        };

    } catch (e) {
        return { success: false, message: e.message };
    } finally {
        if (_browser) await _browser.close();
    }
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

module.exports = { getAttendance, getTodayAttendance };
