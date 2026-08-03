
const mongoose = require("mongoose");
const User = require("./src/shared/models/User");

mongoose.connect("mongodb://127.0.0.1:27017/aditya_university").then(async () => {
    const user = await User.findOne({ username: "24P31A1243" });
    if (user && user.marksHistory) {
        console.log("External Marks:", user.marksHistory.externalMarks ? user.marksHistory.externalMarks.length : 0);
        console.log("Attendance:", user.marksHistory.previousSemAttendance ? user.marksHistory.previousSemAttendance.length : 0);
    } else {
        console.log("No marks history found for ACET user!");
    }
    process.exit(0);
});

