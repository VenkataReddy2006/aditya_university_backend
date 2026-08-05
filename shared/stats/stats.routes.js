const express = require('express');
const router = express.Router();
const Stats = require('../models/Stats');

// GET /api/stats - get all stats from the stats collection
router.get('/', async (req, res) => {
    try {
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats();
            await stats.save();
        }
        res.json({ total: stats.total, aec: stats.aec, acet: stats.acet, aus: stats.aus });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// POST /api/stats/increment
router.post('/increment', async (req, res) => {
    try {
        const { college } = req.body;
        const validColleges = ['aec', 'acet', 'aus'];
        
        let stats = await Stats.findOne();
        if (!stats) {
            stats = new Stats();
        }
        
        stats.total += 1;
        
        if (college && validColleges.includes(college.toLowerCase())) {
            stats[college.toLowerCase()] += 1;
        }
        
        await stats.save();
        res.json({ success: true, stats });
    } catch (error) {
        console.error("Error incrementing stats:", error);
        res.status(500).json({ error: "Failed to increment stats" });
    }
});

module.exports = router;
