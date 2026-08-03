
const mongoose = require("mongoose");
const User = require("./src/shared/models/User");

mongoose.connect("mongodb://localhost:27017/aditya_university").then(async () => {
    const user = await User.findOne({ username: "23A91A0549" });
    console.log("College:", user.college);
    process.exit(0);
});

