const {
    loginStudent,
    getAttendance,
    getProfile
} = require("./aec.service");

async function login(req, res) {

    try {

        const { username, password } = req.body;

        const result = await loginStudent(username, password);

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

        const result = await getAttendance(username, password, fromDate, toDate);

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
        const { getTodayAttendance } = require("./aec.service");
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
        const url = `https://info.aec.edu.in/aec/StudentPhotos/${rollNo}.jpg`;
        
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