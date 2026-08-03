const express = require('express');
const router = express.Router();
const Stats = require('../models/Stats');

// Helper to get or create stats document
async function getStatsDoc() {
    let stats = await Stats.findOne();
    if (!stats) {
        stats = new Stats({ total: 0, aec: 0, acet: 0, aus: 0 });
        await stats.save();
    }
    return stats;
}

// GET /api/stats - get all stats
router.get('/', async (req, res) => {
    try {
        const stats = await getStatsDoc();
        res.json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// POST /api/stats/increment - increment login count for a college
router.post('/increment', async (req, res) => {
    try {
        const { college } = req.body;
        if (!college) {
            return res.status(400).json({ error: "College is required" });
        }
        
        const collegeLower = college.toLowerCase();
        if (!['aec', 'acet', 'aus'].includes(collegeLower)) {
            return res.status(400).json({ error: "Invalid college" });
        }

        const stats = await getStatsDoc();
        stats.total += 1;
        stats[collegeLower] += 1;
        await stats.save();

        res.json(stats);
    } catch (error) {
        console.error("Error incrementing stats:", error);
        res.status(500).json({ error: "Failed to increment stats" });
    }
});

module.exports = router;
