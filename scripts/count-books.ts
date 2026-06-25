require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const { retrieveRelevantContext } = require('../src/services/ragService');

async function run() {
    try {
        const query = "cox bazar tour ase?";
        const context = (await retrieveRelevantContext(query)) as string;
        
        console.log("=== TOUR CONTEXT CHECK ===");
        const lines = context.split('\n');
        const tourLines = lines.filter(l => l.includes("Tour:"));
        console.log("Found Tour mentions in context:", tourLines.length);
        tourLines.forEach(l => console.log(l));
    } catch (err) {
        console.error("Error running test:", err);
    }
    process.exit(0);
}

run();
