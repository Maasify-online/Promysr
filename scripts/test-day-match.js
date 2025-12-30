function testDayLogic() {
    console.log("calendar Testing Day Matching Logic...");

    // Scenario: User is in IST (+5.5). 
    // User wants email at Tuesday 02:00 AM.
    // Equivalent UTC: Monday 20:30 PM (8:30 PM).

    // System runs at Monday 20:30 UTC.
    const mockUTCNow = new Date('2023-10-09T20:30:00Z'); // Oct 9 2023 is a Monday

    const utcDay = mockUTCNow.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();

    console.log(`Current UTC Time: ${mockUTCNow.toISOString()}`);
    console.log(`Current UTC Day: ${utcDay}`); // Should be 'monday'

    // User Settings
    const userTimezone = 'Asia/Kolkata';
    const userOffset = 5.5; // Hours
    const preferredDays = ['tuesday']; // User wants it on Tuesday

    // Logic in Question: 
    // "const isRightDay = preferredDays.includes(currentDayOfWeek)" <- This uses UTC Day
    const currentCodeCheck = preferredDays.includes(utcDay);

    console.log(`User Wants: ${preferredDays.join(', ')}`);
    console.log(`Logic check with UTC Day ('${utcDay}'): ${currentCodeCheck ? "PASS" : "FAIL"}`);

    if (!currentCodeCheck) {
        console.error("❌ BUG CONFIRMED: User expects email on Tuesday morning, but UTC is still Monday. The check failed.");
    } else {
        console.log("✅ Logic seems fine?");
    }

    // PROPOSED FIX:
    // Calculate User's Local Time
    const userLocalTime = new Date(mockUTCNow.getTime() + (userOffset * 60 * 60 * 1000));
    const userLocalDay = userLocalTime.getUTCDay(); // 0-6 (Sun-Sat) or similar
    // Actually, simple way: using ToLocaleString with timezone
    const userDayStr = mockUTCNow.toLocaleDateString('en-US', { weekday: 'long', timeZone: userTimezone }).toLowerCase();

    const fixedCheck = preferredDays.includes(userDayStr);
    console.log(`\nProposed Logic: Check against User Timezone Day ('${userDayStr}')`);
    console.log(`Result: ${fixedCheck ? "PASS" : "FAIL"}`);
}

testDayLogic();
