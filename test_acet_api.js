
const axios = require("axios");

async function test() {
    try {
        console.log("Logging in ACET user via API...");
        const res = await axios.post("http://127.0.0.1:3000/api/sync/login", {
            username: "24P31A1243",
            password: "Nikhil@6893",
            college: "ACET"
        });
        const data = res.data.data;
        console.log("Success:", res.data.success);
        console.log("User in DB:", data.username);
        console.log("External marks semesters:", data.marksHistory.externalMarks.length);
        console.log("Attendance semesters:", data.marksHistory.previousSemAttendance.length);
    } catch(err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
test();

