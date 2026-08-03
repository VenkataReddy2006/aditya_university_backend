
const axios = require("axios");
axios.get("https://info.aec.edu.in/aus/StudentLogin.aspx", {validateStatus: ()=>true})
    .then(res => console.log(res.status))
    .catch(console.error);

