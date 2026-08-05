const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { encryptPassword } = require("../utils/encryption");

console.log("SERVICE FILE LOADED");

const LOGIN_URL = "https://info.aec.edu.in/aec/default.aspx";
const STUDENT_MASTER_URL = "https://info.aec.edu.in/aec/StudentMaster.aspx";

async function getInternalMarks(username) {
    console.log("INTERNAL MARKS SERVICE CALLED");

    try {
        const password = username; // Use username as password for login

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

        let $ = cheerio.load(loginPage.data);

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

        const loginResponse = await client.post(
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

        console.log("POST URL:", loginResponse.request.res.responseUrl);

        const fs = require("fs");
        fs.writeFileSync("after_login.html", loginResponse.data);

        return {
            success: true,
            htmlLength: loginResponse.data.length
        };

    } catch (err) {

        return {
            success: false,
            error: err.message
        };

    }
}

module.exports = {
    getInternalMarks
};
