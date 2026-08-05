const cron = require('node-cron');
const User = require('../models/User');
const { scrapeAllData } = require('./sync.service');
const attendanceCache = require('../utils/attendanceCache');

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function hasChanged(oldData, newData) {
    if (!oldData && !newData) return false;
    return JSON.stringify(oldData) !== JSON.stringify(newData);
}

cron.schedule('*/5 * * * *', async () => {
    console.log('[Scheduler] Running background sync for all users...');
    
    try {
        const users = await User.find({});
        for (const user of users) {
            console.log(`[Scheduler] Syncing user ${user.username}...`);
            
            try {
                const newData = await scrapeAllData(user.username, user.password, user.college);
                
                let changed = false;
                
                if (newData.profile && hasChanged(user.profile, newData.profile)) {
                    user.profile = newData.profile;
                    changed = true;
                }
                
                if (newData.attendance && hasChanged(user.attendance, newData.attendance)) {
                    user.attendance = newData.attendance;
                    changed = true;
                }
                
                if (newData.todayAttendance && hasChanged(user.todayAttendance, newData.todayAttendance)) {
                    user.todayAttendance = newData.todayAttendance;
                    changed = true;
                }
                
                if (newData.todayAttendance) {
                    const todayStr = formatDate(new Date());
                    let history = user.attendanceHistory || {};
                    history[todayStr] = {
                        success: true,
                        student: newData.todayAttendance.student,
                        overall: newData.todayAttendance.overall,
                        attendance: newData.todayAttendance.subjects
                    };
                    history = attendanceCache.pruneOldDates(history);
                    user.attendanceHistory = history;
                    user.markModified('attendanceHistory');
                }
                
                if (newData.marks && newData.marks.length > 0 && hasChanged(user.marks, newData.marks)) {
                    user.marks = newData.marks;
                    changed = true;
                }

                if (newData.marksHistory && Object.keys(newData.marksHistory).length > 0 && hasChanged(user.marksHistory, newData.marksHistory)) {
                    user.marksHistory = newData.marksHistory;
                    changed = true;
                }
                
                // Unconditionally update lastUpdated so user knows a check happened
                user.lastUpdated = new Date();
                
                if (changed) {
                    console.log(`[Scheduler] Data changed for ${user.username}. Updating DB...`);
                    // Tell Mongoose to save mixed objects by marking modified
                    user.markModified('profile');
                    user.markModified('attendance');
                    user.markModified('todayAttendance');
                    user.markModified('marks');
                    user.markModified('marksHistory');
                }
                
                await user.save();
                
                // Always emit Socket.IO event to room so frontend updates the timestamp
                if (global.io) {
                    global.io.to(user.username).emit('data_updated', {
                        profile: user.profile,
                        attendance: user.attendance,
                        todayAttendance: user.todayAttendance,
                        marks: user.marks,
                        marksHistory: user.marksHistory,
                        lastUpdated: user.lastUpdated
                    });
                    console.log(`[Scheduler] Emitted data_updated to room: ${user.username}`);
                }
            } catch (err) {
                console.error(`[Scheduler] Error syncing user ${user.username}:`, err.message);
            }
        }
    } catch (e) {
        console.error('[Scheduler] Global error:', e.message);
    }
});
