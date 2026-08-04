const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/stats - get all stats based on actual users in MongoDB
router.get('/', async (req, res) => {
    try {
        const aec = await User.countDocuments({ college: 'AEC' });
        const acet = await User.countDocuments({ college: 'ACET' });
        const aus = await User.countDocuments({ college: 'AUS' });
        const total = aec + acet + aus;
        
        res.json({ total, aec, acet, aus });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// POST /api/stats/increment - deprecated since we now count real users
router.post('/increment', async (req, res) => {
    res.json({ success: true, message: "Increment deprecated, using real user counts" });
});

module.exports = router;
