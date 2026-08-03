
const { loginStudent } = require("./src/aec/aec.service");
async function go() {
    console.log("Logging in...");
    const login = await loginStudent("23A91A0549", "Reddy@2006");
    if (!login.success) return console.log("Login failed");
    
    console.log("Fetching StudentMarksReport...");
    const response = await login.client.get("https://info.aec.edu.in/aec/Academics/StudentMarksReport.aspx?scrid=15");
    require("fs").writeFileSync("aec_marks.html", response.data);
    console.log("Saved aec_marks.html");
}
go();

