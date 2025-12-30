function verifyFullFlow() {
    console.log("🛡️ Final System Verification: User 'Info' Configuration");
    console.log("---------------------------------------------------");

    // 1. Configuration (From Database)
    const settings = {
        time: '08:00:00',
        timezone: 'Asia/Kolkata',
        days: ['monday', 'tuesday', 'wednesday', 'thursday'] // Friday is OFF
    };

    // User wants 8:00 AM IST.
    // IST is UTC+5.5.
    // UTC equivalent should be: 8 - 5.5 = 2.5 (02:30 AM UTC).

    // 2. Logic Implementation (Mirrors send-scheduled-emails/index.ts)
    function checkShouldSend(mockNowUTC) {
        const currentUTCHour = mockNowUTC.getUTCHours();

        // Offset Logic (Fixed)
        let utcOffset = 0;
        if (settings.timezone === 'Asia/Kolkata') utcOffset = 5.5;

        const [userHour] = settings.time.split(':').map(Number); // 8
        const targetUTCHour = (userHour - utcOffset + 24) % 24; // (8 - 5.5 + 24) % 24 = 2.5

        // Day Logic (Fixed: Use User Timezone)
        const userDayOfWeek = mockNowUTC.toLocaleDateString('en-US', { weekday: 'long', timeZone: settings.timezone }).toLowerCase();

        // Checks
        const isRightHour = currentUTCHour === Math.floor(targetUTCHour); // 2 === 2
        const isRightDay = settings.days.includes(userDayOfWeek);

        return { isRightHour, isRightDay, userDayOfWeek, currentUTCHour, targetUTCHour };
    }

    // --- TEST CASE A: Success (Tuesday 8:00 AM IST) ---
    // Tuesday 8:00 AM IST = Monday 10:30 PM UTC ?? No wait.
    // IST is +5:30. 
    // If it is 8:00 AM IST on Tuesday, UTC is 2:30 AM Tuesday.
    // Wait, let's verify that math. 
    // 02:30 UTC + 5.5 = 08:00 Local. Correct.

    const mockSuccess = new Date('2023-10-10T02:30:00Z'); // Oct 10 2023 is Tuesday

    console.log(`\n🧪 Case A: Tuesday 8:00 AM IST (Simulated UTC: ${mockSuccess.toISOString()})`);
    const resA = checkShouldSend(mockSuccess);
    console.log(`   User Day: ${resA.userDayOfWeek} (Expected: tuesday)`);
    console.log(`   UTC Hour: ${resA.currentUTCHour} vs Target: ${Math.floor(resA.targetUTCHour)}`);

    if (resA.isRightHour && resA.isRightDay) {
        console.log("   ✅ RESULT: EMAIL SENT");
    } else {
        console.error(`   ❌ RESULT: FAILED (Hour: ${resA.isRightHour}, Day: ${resA.isRightDay})`);
    }

    // --- TEST CASE B: Off Day (Friday 8:00 AM IST) ---
    const mockFriday = new Date('2023-10-13T02:30:00Z'); // Oct 13 2023 is Friday
    console.log(`\n🧪 Case B: Friday 8:00 AM IST (User has Friday OFF)`);
    const resB = checkShouldSend(mockFriday);
    console.log(`   User Day: ${resB.userDayOfWeek} (Expected: friday)`);

    if (resB.isRightHour && !resB.isRightDay) {
        console.log("   ✅ RESULT: SKIPPED (Correctly blocked by day filter)");
    } else {
        console.error(`   ❌ RESULT: FAILED (Hour: ${resB.isRightHour}, Day: ${resB.isRightDay})`);
    }

    // --- TEST CASE C: Wrong Time (Tuesday 9:00 AM IST) ---
    // 9:00 AM IST = 03:30 UTC
    const mockWrongTime = new Date('2023-10-10T03:30:00Z');
    console.log(`\n🧪 Case C: Tuesday 9:00 AM IST (Wrong Time)`);
    const resC = checkShouldSend(mockWrongTime);

    if (!resC.isRightHour) {
        console.log("   ✅ RESULT: SKIPPED (Correctly blocked by time check)");
    } else {
        console.error("   ❌ RESULT: FAILED (Sent at wrong time)");
    }
}

verifyFullFlow();
