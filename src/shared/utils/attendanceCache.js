const User = require('../models/User');

function parseDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function isWithin60Days(dateStr) {
    const targetDate = parseDate(dateStr);
    if (!targetDate) return false;
    
    // We set both to midnight to accurately count days
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = now - targetDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    // If it's a future date somehow, it's fine. If it's within 60 days in the past.
    return diffDays >= 0 && diffDays <= 60;
}

function pruneOldDates(historyObj) {
    if (!historyObj) return {};
    const newHistory = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    for (const [dateStr, data] of Object.entries(historyObj)) {
        const targetDate = parseDate(dateStr);
        if (targetDate) {
            targetDate.setHours(0, 0, 0, 0);
            const diffTime = now - targetDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays >= 0 && diffDays <= 60) {
                newHistory[dateStr] = data;
            }
        }
    }
    return newHistory;
}

async function getCachedAttendance(username, dateStr) {
    if (!isWithin60Days(dateStr)) return null;
    
    const user = await User.findOne({ username });
    if (!user || !user.attendanceHistory) return null;
    
    return user.attendanceHistory[dateStr] || null;
}

async function saveToCache(username, dateStr, attendanceData) {
    const user = await User.findOne({ username });
    if (!user) return;
    
    let history = user.attendanceHistory || {};
    history[dateStr] = attendanceData;
    
    history = pruneOldDates(history);
    
    user.attendanceHistory = history;
    user.markModified('attendanceHistory');
    await user.save();
}

module.exports = {
    isWithin60Days,
    pruneOldDates,
    getCachedAttendance,
    saveToCache
};
