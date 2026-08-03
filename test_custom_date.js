const axios = require('axios');
axios.post('http://localhost:3000/api/aec/attendance', {
    username: "23A91A0549",
    password: "encrypted_or_not_doesnt_matter_here",
    college: "AEC",
    fromDate: "21-07-2026",
    toDate: "21-07-2026"
}).then(res => console.log(res.data)).catch(err => console.log(err.response ? err.response.data : err.message));
