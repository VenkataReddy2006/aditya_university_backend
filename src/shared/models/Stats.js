const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    total: { type: Number, default: 0 },
    aec: { type: Number, default: 0 },
    acet: { type: Number, default: 0 },
    aus: { type: Number, default: 0 }
});

module.exports = mongoose.model('Stats', statsSchema);
