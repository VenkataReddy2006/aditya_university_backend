const aecService = require("../../aec/aec.service");
const acetService = require("../../acet/acet.service");
const ausService = require("../../aus/aus.service");
const acetAttendanceService = require("../../acet/acetAttendance.service");
const marksService = require("../exam/sharedMarks.service");

async function scrapeAllData(username, password, college) {
    let service = aecService;
    if (college === 'ACET') service = acetService;
    if (college === 'AUS') service = ausService;
    
    // Profile
    const profileRes = await service.getProfile(username, password);
    
    if (profileRes.requires_webview) {
        return { requires_webview: true, message: profileRes.message };
    }
    
    const profile = profileRes.success ? profileRes.profile : null;
    
    // Attendance
    let attendanceRes;
    let todayRes;
    
    if (college === 'ACET') {
        attendanceRes = await acetAttendanceService.getAttendance(username, password);
        todayRes = await acetAttendanceService.getTodayAttendance(username, password);
    } else {
        attendanceRes = await service.getAttendance(username, password);
        todayRes = await service.getTodayAttendance(username, password);
    }
    
    const attendance = attendanceRes.success ? { 
        student: attendanceRes.student, 
        overall: attendanceRes.overall, 
        subjects: attendanceRes.attendance 
    } : null;
    
    const todayAttendance = todayRes.success ? { 
        student: todayRes.student, 
        overall: todayRes.overall, 
        subjects: todayRes.attendance 
    } : null;
    
    // Marks (exam portal works for both AEC and ACET)
    let marks = [];
    try {
        const marksRes = await marksService.getSemesters(username, college);
        if (marksRes.success) {
            marks = marksRes.semesters;
        }
    } catch (e) {
        console.error("Error scraping marks:", e.message);
    }
    
    // Marks History (from info.aec.edu.in marks section)
    let marksHistory = {};
    try {
        const histRes = await service.getMarksHistory(username, password);
        if (histRes && histRes.success) {
            marksHistory = histRes.marks;
        }
    } catch (e) {
        console.error("Error scraping marks history:", e.message);
    }
    
    return {
        profile,
        attendance,
        todayAttendance,
        marks,
        marksHistory
    };
}

module.exports = {
    syncAllWithCookie,
    scrapeAllData
};

async function syncWithCookie(cookieString) {
    const loginRes = ausService.loginWithCookie(cookieString);
    if (!loginRes.success) return { success: false, message: "Invalid cookie" };
    
    const cookieClient = loginRes.client;
    
    // Hardcoding username as we just need it for requests. In AUS it usually comes from session, but let us assume the client fetches data without needing explicit username since cookie works.
    // Wait, the requests actually NEED RollNo for the payload.
    // We should parse the RollNo from the profile!
    // But getProfile takes username. Wait, if we send an empty username, will it work?
    // Let us require username alongside cookie.
    
    // Better to just accept username and cookie.
}

async function syncAllWithCookie(username, cookieString, userAgent) {
    const loginRes = ausService.loginWithCookie(cookieString, userAgent);
    if (!loginRes.success) return { success: false, message: "Invalid cookie" };
    const cookieClient = loginRes.client;
    
    // Profile
    const profileRes = await ausService.getProfile(username, "", cookieClient);
    const profile = profileRes.success ? profileRes.profile : null;
    
    // Attendance
    const attendanceRes = await ausService.getAttendance(username, "", "", "", cookieClient);
    const todayRes = await ausService.getTodayAttendance(username, "", cookieClient);
    
    const attendance = attendanceRes.success ? { 
        student: attendanceRes.student, 
        overall: attendanceRes.overall, 
        subjects: attendanceRes.attendance 
    } : null;
    
    const todayAttendance = todayRes.success ? { 
        student: todayRes.student, 
        overall: todayRes.overall, 
        subjects: todayRes.attendance 
    } : null;
    
    // Marks (exam portal works without loginStudent cookie override if we use sharedMarks, but sharedMarks uses its own playwright login. Let us just use sharedMarks as is)
    let marks = [];
    try {
        const marksRes = await marksService.getSemesters(username, "AUS");
        if (marksRes.success) {
            marks = marksRes.semesters;
        }
    } catch (e) {
        console.error("Error scraping marks:", e.message);
    }
    
    // Marks History
    let marksHistory = {};
    try {
        const histRes = await ausService.getMarksHistory(username, "", cookieClient);
        if (histRes && histRes.success) {
            marksHistory = histRes.marks;
        }
    } catch (e) {
        console.error("Error scraping marks history:", e.message);
    }
    
    return {
        profile,
        attendance,
        todayAttendance,
        marks,
        marksHistory
    };
}
