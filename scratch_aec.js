
const { loginStudent } = require("./src/aec/aec.service");
async function checkMarksLink() {
    console.log("Logging in...");
    const login = await loginStudent("22A91A0549", "Venkat2006");
    if (!login.success) return console.log("Login failed", login);
    const client = login.client;
    console.log("Fetching StudentMaster.aspx...");
    const res = await client.get("https://info.aec.edu.in/aec/StudentMaster.aspx");
    require("fs").writeFileSync("student_master.html", res.data);
    console.log("Saved to student_master.html");
}
checkMarksLink();

