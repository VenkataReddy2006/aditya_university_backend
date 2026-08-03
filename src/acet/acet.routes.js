const express = require("express");

const {
    login,
    profile,
    attendance,
    todayAttendance,
    semesters,
    marks
} = require("./acet.controller");

const router = express.Router();

router.post("/login", login);
router.post("/profile", profile);
router.post("/attendance", attendance);
router.post("/today-attendance", todayAttendance);
router.post("/marks/semesters", semesters);
router.post("/marks", marks);

module.exports = router;
