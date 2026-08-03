const { loginToExamPortal } = require("./src/services/exam.service");

loginToExamPortal("23A91A0549").then(res => {
    console.log("FINAL RESULT:", JSON.stringify(res, null, 2));
}).catch(err => {
    console.error("ERROR:", err);
});
