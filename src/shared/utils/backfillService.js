const aecService = require('../../aec/aec.service');
const acetService = require('../../acet/acetAttendance.service');
const ausService = require('../../aus/aus.service');
const attendanceCache = require('./attendanceCache');

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

async function backfillPast30Days(username, password, college) {
    console.log(`[Backfill] Starting 30-day background backfill for ${username} (${college})...`);
    
    // We only need to fetch the past 30 days, going backwards.
    for (let i = 0; i <= 30; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - i);
        const dateStr = formatDate(targetDate);
        
        try {
            // Check if we already have it
            const cached = await attendanceCache.getCachedAttendance(username, dateStr);
            if (cached) {
                continue; // Skip if already exists
            }
            
            // Otherwise, fetch it live
            let result;
            if (college === 'AEC') {
                result = await aecService.getAttendance(username, password, dateStr, dateStr);
            } else if (college === 'ACET') {
                result = await acetService.getAttendance(username, password, dateStr, dateStr);
            } else if (college === 'AUS') {
                result = await ausService.getAttendance(username, password, dateStr, dateStr);
            } else {
                result = await aecService.getAttendance(username, password, dateStr, dateStr); // fallback
            }
            
            if (result && result.success) {
                // Save it to cache
                await attendanceCache.saveToCache(username, dateStr, result);
                console.log(`[Backfill] Successfully cached ${dateStr} for ${username}`);
            }
            
        } catch (e) {
            console.error(`[Backfill] Error for ${username} on ${dateStr}:`, e.message);
        }
        
        // Wait 1 second before the next request to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`[Backfill] Completed background backfill for ${username}.`);
}

module.exports = {
    backfillPast30Days
};
