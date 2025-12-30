function testLogic() {
    console.log("🧪 Testing Timezone Logic...");

    const testCases = [
        { zone: 'Asia/Kolkata', offset: 5.5, userHour: 8, expectedUTC: 2.5 }, // 8 AM IST -> 2:30 AM UTC
        { zone: 'America/New_York', offset: -5, userHour: 9, expectedUTC: 14 }, // 9 AM EST -> 2 PM UTC (14:00)
        { zone: 'Asia/Tokyo', offset: 9, userHour: 9, expectedUTC: 0 }, // 9 AM JST -> 0 AM UTC
    ];

    testCases.forEach(tc => {
        // Formula in code: const targetUTCHour = (userHour - utcOffset + 24) % 24
        const targetUTCHour = (tc.userHour - tc.offset + 24) % 24;

        const passed = targetUTCHour === tc.expectedUTC;
        const icon = passed ? "✅" : "❌";

        console.log(`${icon} Zone: ${tc.zone} | User: ${tc.userHour}:00 | Offset: ${tc.offset}`);
        console.log(`   Expected UTC: ${tc.expectedUTC} | Calculated UTC: ${targetUTCHour}`);

        if (!passed) console.error(`   FAIL: Expected ${tc.expectedUTC}, got ${targetUTCHour}`);
    });
}

testLogic();
