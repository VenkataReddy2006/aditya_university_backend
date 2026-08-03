const mongoose = require('mongoose');
const { getAttendance } = require('./src/aec/aec.service');
const User = require('./src/shared/models/User');

const MONGO_URI = "mongodb+srv://23a91a0549_db_user:Venkat2006@aditya.wcvv5ld.mongodb.net/aditya_university?appName=aditya";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    const user = await User.findOne({ username: '23A91A0549' });
    if (!user) {
        console.log("User not found");
        process.exit(1);
    }
    console.log("Found user, fetching attendance...");
    try {
        const result = await getAttendance(user.username, user.password, "21-07-2026", "21-07-2026");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Caught error:", err);
    }
    process.exit(0);
}

run();
