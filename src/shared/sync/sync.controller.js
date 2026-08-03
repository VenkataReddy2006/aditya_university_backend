
const User = require("../models/User");
const { scrapeAllData, syncAllWithCookie } = require("./sync.service");

function hasChanged(oldData, newData) {
    if (!oldData && !newData) return false;
    return JSON.stringify(oldData) !== JSON.stringify(newData);
}

async function login(req, res) {
    try {
        const { username, password, college } = req.body;
        
        // Fast path: check if user exists and password matches
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser.password === password) {
            if (existingUser.profile && Object.keys(existingUser.profile).length > 0) {
                // Trigger background refresh (optional, but good for keeping data fresh)
                refreshDataBackground(username);
                return res.json({ success: true, data: existingUser });
            }
        }
        
        const data = await scrapeAllData(username, password, college);
        
        if (data.requires_webview) {
            return res.status(403).json({ success: false, requires_webview: true, message: data.message });
        }
        
        if (!data.profile && !data.attendance) {
            return res.status(401).json({ success: false, message: "Invalid credentials or failed to fetch data" });
        }
        
        const user = await User.findOneAndUpdate(
            { username },
            {
                password,
                college,
                profile: data.profile,
                attendance: data.attendance,
                todayAttendance: data.todayAttendance,
                marks: data.marks,
                marksHistory: data.marksHistory,
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );
        
        res.json({ success: true, data: user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

async function loginWithCookie(req, res) {
    try {
        const { username, password, cookieString, userAgent } = req.body;
        
        const data = await syncAllWithCookie(username, cookieString, userAgent);
        
        if (!data.profile && !data.attendance) {
            return res.status(401).json({ success: false, message: "Failed to fetch data with cookie" });
        }
        
        const user = await User.findOneAndUpdate(
            { username },
            {
                password,
                college: "AUS",
                profile: data.profile,
                attendance: data.attendance,
                todayAttendance: data.todayAttendance,
                marks: data.marks,
                marksHistory: data.marksHistory,
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );
        
        res.json({ success: true, data: user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

async function getCachedData(req, res) {
    try {
        const { username } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found in cache" });
        }
        
        res.json({ success: true, data: user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

async function refreshData(req, res) {
    try {
        const { username } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        const data = await scrapeAllData(user.username, user.password, user.college);
        
        if (data.requires_webview) {
            return res.status(403).json({ success: false, requires_webview: true, message: data.message });
        }
        
        let changed = false;
        
        if (hasChanged(user.profile, data.profile)) {
            user.profile = data.profile;
            user.markModified("profile");
            changed = true;
        }
        if (hasChanged(user.attendance, data.attendance)) {
            user.attendance = data.attendance;
            user.markModified("attendance");
            changed = true;
        }
        if (hasChanged(user.todayAttendance, data.todayAttendance)) {
            user.todayAttendance = data.todayAttendance;
            user.markModified("todayAttendance");
            changed = true;
        }
        if (hasChanged(user.marks, data.marks)) {
            user.marks = data.marks;
            user.markModified("marks");
            changed = true;
        }
        if (hasChanged(user.marksHistory, data.marksHistory)) {
            user.marksHistory = data.marksHistory;
            user.markModified("marksHistory");
            changed = true;
        }
        
        user.lastUpdated = new Date();
        await user.save();
        
        if (global.io) {
            global.io.to(user.username).emit("data_updated", {
                profile: user.profile,
                attendance: user.attendance,
                todayAttendance: user.todayAttendance,
                marks: user.marks,
                marksHistory: user.marksHistory,
                lastUpdated: user.lastUpdated
            });
        }
        
        res.json({ success: true, data: user });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Helper to refresh data in the background after a fast login
async function refreshDataBackground(username) {
    try {
        const user = await User.findOne({ username });
        if (!user) return;
        
        const data = await scrapeAllData(user.username, user.password, user.college);
        if (data.requires_webview) return;
        
        if (data.profile && data.attendance) {
            let changed = false;
            
            if (hasChanged(user.profile, data.profile)) {
                user.profile = data.profile;
                user.markModified("profile");
                changed = true;
            }
            if (hasChanged(user.attendance, data.attendance)) {
                user.attendance = data.attendance;
                user.markModified("attendance");
                changed = true;
            }
            if (hasChanged(user.todayAttendance, data.todayAttendance)) {
                user.todayAttendance = data.todayAttendance;
                user.markModified("todayAttendance");
                changed = true;
            }
            if (hasChanged(user.marks, data.marks)) {
                user.marks = data.marks;
                user.markModified("marks");
                changed = true;
            }
            if (hasChanged(user.marksHistory, data.marksHistory)) {
                user.marksHistory = data.marksHistory;
                user.markModified("marksHistory");
                changed = true;
            }
            
            user.lastUpdated = new Date();
            await user.save();
            
            if (global.io) {
                global.io.to(user.username).emit("data_updated", {
                    profile: user.profile,
                    attendance: user.attendance,
                    todayAttendance: user.todayAttendance,
                    marks: user.marks,
                    marksHistory: user.marksHistory,
                    lastUpdated: user.lastUpdated
                });
            }
        }
    } catch (err) {
        console.log("Background refresh error:", err.message);
    }
}

async function storeCredentials(req, res) {
    try {
        const { username, password, college } = req.body;
        
        if (!username || !password || !college) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        
        const user = await User.findOneAndUpdate(
            { username },
            {
                password,
                college,
                lastUpdated: new Date()
            },
            { new: true, upsert: true }
        );
        
        res.json({ success: true, message: "Credentials stored successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = {
    login,
    loginWithCookie,
    getCachedData,
    refreshData,
    storeCredentials
};

