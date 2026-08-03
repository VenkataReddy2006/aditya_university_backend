
const mongoose = require("mongoose");
const MONGO_URI = "mongodb+srv://23a91a0549_db_user:Venkat2006@aditya.wcvv5ld.mongodb.net/aditya_university?appName=aditya";
mongoose.connect(MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection("users").find({ username: "22A91A0549" }).toArray();
    console.log(users.map(u => ({ username: u.username, password: u.password, college: u.college })));
    process.exit();
});

