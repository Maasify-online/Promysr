
function testLogic() {
    console.log("🧪 Testing New 30-Minute Precision Logic...");

    const testCases = [
        {
            name: "12:00 PM IST (Target UTC 06:30)",
            zone: 'Asia/Kolkata',
            offset: 5.5,
            userTime: "12:00",
            currentSystemTimeUTC: "06:00",
            shouldSend: false
        },
        {
            name: "12:00 PM IST (Target UTC 06:30)", // THE MATCH
            zone: 'Asia/Kolkata',
            offset: 5.5,
            userTime: "12:00",
            currentSystemTimeUTC: "06:30",
            shouldSend: true
        },
        {
            name: "12:00 PM IST (Target UTC 06:30)",
            zone: 'Asia/Kolkata',
            offset: 5.5,
            userTime: "12:00",
            currentSystemTimeUTC: "07:00",
            shouldSend: false
        },
        {
            name: "09:00 AM EST (Target UTC 14:00)", // Exact Hour Match
            zone: 'America/New_York',
            offset: -5,
            userTime: "09:00",
            currentSystemTimeUTC: "14:00",
            shouldSend: true
        },
    ];

    testCases.forEach(tc => {
        // Parse User Time
        const [uH, uM] = tc.userTime.split(':').map(Number);
        const userTimeFloat = uH + (uM / 60);

        // Calculate Target UTC
        const targetUTC = (userTimeFloat - tc.offset + 24) % 24;

        // Parse System Time
        const [cH, cM] = tc.currentSystemTimeUTC.split(':').map(Number);
        const currentUTC = cH + (cM / 60);

        // Logic check (matching the Edge Function)
        const timeDiff = Math.abs(targetUTC - currentUTC);
        const wrapDiff = 24 - timeDiff;
        const isRightTime = (timeDiff < 0.1) || (wrapDiff < 0.1);

        const passed = isRightTime === tc.shouldSend;
        const icon = passed ? "✅" : "❌";

        console.log(`\n${icon} [${tc.name}]`);
        console.log(`   User Pref: ${tc.userTime} ${tc.zone} (Offset ${tc.offset})`);
        console.log(`   System UTC: ${tc.currentSystemTimeUTC}`);
        console.log(`   Target UTC: ${targetUTC.toFixed(2)} | Current UTC: ${currentUTC.toFixed(2)}`);
        console.log(`   Diff: ${timeDiff.toFixed(2)}`);
        console.log(`   Decision: ${isRightTime ? "SEND" : "SKIP"} (Expected: ${tc.shouldSend ? "SEND" : "SKIP"})`);

        if (!passed) console.error("   !!! TEST FAILED !!!");
    });
}

testLogic();
