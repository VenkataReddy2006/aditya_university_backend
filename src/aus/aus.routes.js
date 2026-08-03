const express = require("express");
const router = express.Router();

const {
    login,
    attendance,
    image,
    profile,
    todayAttendance
} = require("./aus.controller");

router.post("/login", login);

router.post("/attendance", attendance);

router.post("/today-attendance", todayAttendance);

router.get("/image/:rollNo", image);

router.post("/profile", profile);

module.exports = router;