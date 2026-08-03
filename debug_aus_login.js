
const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { encryptPassword } = require("./src/shared/utils/encryption");

async function test() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true, maxRedirects: 10, validateStatus: () => true }));
    const LOGIN_URL = "https://info.aec.edu.in/aus/default.aspx";
    
    const loginPage = await client.get(LOGIN_URL);
    
    const $ = cheerio.load(loginPage.data);
    const viewstate = $("#__VIEWSTATE").val();
    
    const encrypted = encryptPassword("Siddu@2007");
    
    const form = {
        __VIEWSTATE: viewstate,
        __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").val(),
        __VIEWSTATEENCRYPTED: $("#__VIEWSTATEENCRYPTED").val() || "",
        __EVENTVALIDATION: $("#__EVENTVALIDATION").val(),
        userType: "rbtStudent",
        txtUserId: "25B11EC001",
        txtPassword: encrypted,
        btnLogin: "LOGIN",
        hdnpwd: encrypted,
        hdnDPToken: $("#hdnDPToken").val(),
        hdnonce: $("#hdnonce").val() || "",
        "cf-turnstile-response": "dummy_token_123"
    };
    
    const res = await client.post(LOGIN_URL, qs.stringify(form), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: "https://info.aec.edu.in",
            Referer: LOGIN_URL,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        }
    });
    
    console.log("Success?", res.request.res.responseUrl.includes("StudentMaster"));
}
test();

