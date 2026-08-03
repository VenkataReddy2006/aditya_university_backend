const { loginStudent } = require("./src/aec/aec.service");
async function go() {
    console.log("Logging in...");
    const login = await loginStudent("23A91A0549", "Reddy@2006");
    if (!login.success) return console.log("Login failed");
    
    console.log("Fetching ShowMarks...");
    const MARKS_URL = "https://info.aec.edu.in/aec/ajax/Academics_StudentMarksReport,App_Web_studentmarksreport.aspx.a2a1b31c.ashx?_method=ShowMarks&_session=rw";
    
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
    if (html.startsWith("\"") && html.endsWith("\"")) {
        html = html.substring(1, html.length - 1);
    }
    // simple replace of quotes and newlines from JS string
    html = html.replace(/\\r\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\'/g, "'");
    require("fs").writeFileSync("aec_marks_actual.html", html);
    console.log("Saved aec_marks_actual.html");
}
go();
