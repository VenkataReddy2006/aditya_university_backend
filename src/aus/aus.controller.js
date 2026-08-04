const {
    loginStudent,
    getAttendance,
    getProfile
} = require("./aus.service");
const attendanceCache = require('../shared/utils/attendanceCache');

async function login(req, res) {

    try {

        const { username, password } = req.body;

        const result = await loginStudent(username, password);

        if (result.success) {
            const backfillService = require('../shared/utils/backfillService');
            backfillService.backfillPast30Days(username, password, 'AUS').catch(console.error);
        }

        res.json(result);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

}

async function attendance(req, res) {
    try {
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
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

async function todayAttendance(req, res) {
    try {
        const { username, password } = req.body;
        // The service imports will be fixed in a moment
        const { getTodayAttendance } = require("./aus.service");
        const result = await getTodayAttendance(username, password);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

const axios = require("axios");

async function image(req, res) {
    try {
        const { rollNo } = req.params;
        const url = `https://info.aec.edu.in/aus/StudentPhotos/${rollNo}.jpg`;
        
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

async function profile(req, res) {
    try {
        const { username, password } = req.body;
        const result = await getProfile(username, password);
        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

module.exports = {
    login,
    attendance,
    image,
    profile,
    todayAttendance
};