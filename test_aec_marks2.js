
const aec = require("./src/aec/aec.service.js");

async function test() {
    try {
        const res = await aec.getMarksHistory("23A91A0549", "Reddy@2006");
        console.log("Success:", res.success);
        if (res.success) {
            console.log("Ext:", res.marks.externalMarks.length);
            console.log("Att:", res.marks.previousSemAttendance.length);
            console.log(JSON.stringify(res.marks, null, 2).substring(0, 500));
        } else {
            console.log(res);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();

