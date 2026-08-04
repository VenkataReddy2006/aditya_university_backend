const mongoose = require('mongoose');
const User = require('./src/shared/models/User');
const attendanceCache = require('./src/shared/utils/attendanceCache');

async function testCache() {
    await mongoose.connect('mongodb://localhost:27017/aditya_university');

    console.log("Connected to MongoDB.");

    const username = "21A91A05I8"; // assuming a generic username, or let's just find any user
    const user = await User.findOne({});
    if (!user) {
        console.log("No user found");
        process.exit();
    }
    
    console.log("Found user:", user.username);
    
    await attendanceCache.saveToCache(user.username, '01-08-2026', { success: true, test: 'data' });
    
    const updatedUser = await User.findOne({ username: user.username });
    console.log("attendanceHistory after save:", updatedUser.attendanceHistory);
    
    process.exit();
}

testCache();
