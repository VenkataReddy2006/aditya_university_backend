
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { encryptPassword } = require("./src/shared/utils/encryption");

async function loginStudent(username, password) {
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

async function test() {
    const res = await loginStudent("24P31A1243", "Nikhil@6893");
    console.log("Login success:", res.success);
    if (res.success) {
        const MARKS_URL = "https://info.aec.edu.in/acet/ajax/Academics_StudentMarksReport,App_Web_studentmarksreport.aspx.a2a1b31c.ashx?_method=ShowMarks&_session=rw";
        const mRes = await res.client.post(MARKS_URL, "", {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-AjaxPro-Method": "ShowMarks"
            }
        });
        console.log("Marks response length:", mRes.data.length);
        console.log(mRes.data.substring(0, 100));
    } else {
        console.log(res);
    }
}
test();

