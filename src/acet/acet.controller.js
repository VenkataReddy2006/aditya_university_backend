const { login, getProfile } = require("./acet.service");
const { getAttendance, getTodayAttendance } = require("./acetAttendance.service");

async function acetLogin(req, res) {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.json(result);
}

async function acetProfile(req, res) {
    const { username, password } = req.body;
    const result = await getProfile(username, password);
    res.json(result);
}

async function acetAttendance(req, res) {
    const { username, password, fromDate, toDate } = req.body;
    const result = await getAttendance(username, password, fromDate, toDate);
    res.json(result);
}

async function acetTodayAttendance(req, res) {
    const { username, password } = req.body;
    const result = await getTodayAttendance(username, password);
    res.json(result);
}

const { getSemesters, getMarks } = require("../shared/exam/sharedMarks.service");

async function acetSemesters(req, res) {
    const { username, college } = req.body;
    try {
        const result = await getSemesters(username, college || "ACET");
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}

async function acetMarks(req, res) {
    const { username, college, semesterId } = req.body;
    try {
        const result = await getMarks(username, college || "ACET", semesterId);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}

module.exports = {
    login: acetLogin,
    profile: acetProfile,
    attendance: acetAttendance,
    todayAttendance: acetTodayAttendance,
    semesters: acetSemesters,
    marks: acetMarks
};
