const { getInternalMarks } = require('./src/services/internalMarks.service');

getInternalMarks('23A91A0549').then(result => {
    console.log("Result:", result);
}).catch(console.error);
