
const aec = require("./src/aec/aec.service.js");

async function test() {
    try {
        const login = await aec.loginStudent("23A91A0549", "Reddy@2006");
        
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
        console.log("Response starts with:", response.data.substring(0, 200));
        
        const fs = require("fs");
        fs.writeFileSync("test_marks_raw.txt", response.data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();

