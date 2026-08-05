const { login, getProfile } = require("./acet.service");
const { getAttendance, getTodayAttendance } = require("./acetAttendance.service");
const attendanceCache = require('../shared/utils/attendanceCache');

async function acetLogin(req, res) {
    const { username, password } = req.body;
    const result = await login(username, password);
    
    if (result.success) {
        const backfillService = require('../shared/utils/backfillService');
        backfillService.backfillPast30Days(username, password, 'ACET').catch(console.error);
    }
    
    res.json(result);
}

async function acetProfile(req, res) {
    const { username, password } = req.body;
    const result = await getProfile(username, password);
    res.json(result);
}

async function acetAttendance(req, res) {
    const { username, password, fromDate, toDate } = req.body;
    
    if (fromDate === toDate && fromDate !== '') {
        const cached = await attendanceCache.getCachedAttendance(username, fromDate);
        if (cached) {
            return res.json(cached);
        }
    }

    const result = await getAttendance(username, password, fromDate, toDate);

    if (result.success && fromDate === toDate && fromDate !== '') {
        if (attendanceCache.isWithin60Days(fromDate)) {
            attendanceCache.saveToCache(username, fromDate, result).catch(console.error);
        }
    }

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

const axios = require("axios");

async function acetImage(req, res) {
    try {
        const { rollNo } = req.params;
        const url = `https://info.aec.edu.in/acet/StudentPhotos/${rollNo}.jpg`;
        
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });
        
        res.setHeader('Content-Type', 'image/jpeg');
        response.data.pipe(res);
        
    } catch (err) {
        console.log("Image fetch error:", err.message);
        res.status(404).send("Image not found");
    }
}

module.exports = {
    login: acetLogin,
    profile: acetProfile,
    attendance: acetAttendance,
    todayAttendance: acetTodayAttendance,
    semesters: acetSemesters,
    marks: acetMarks,
    image: acetImage
};
