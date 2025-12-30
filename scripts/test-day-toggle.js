function testToggleLogic() {
    console.log("🎛️ Testing Day Toggle Logic...");

    const testCases = [
        {
            daysSelected: ['monday', 'wednesday', 'friday'],
            currentDay: 'monday',
            expected: true,
            desc: "Active day selected"
        },
        {
            daysSelected: ['monday', 'wednesday', 'friday'],
            currentDay: 'tuesday',
            expected: false,
            desc: "Inactive day (Toggled OFF)"
        },
        {
            daysSelected: [],
            currentDay: 'monday',
            expected: false,
            desc: "No days selected"
        }
    ];

    testCases.forEach(tc => {
        const result = tc.daysSelected.includes(tc.currentDay);
        const passed = result === tc.expected;
        const icon = passed ? "✅" : "❌";

        console.log(`${icon} [${tc.desc}] Selected: [${tc.daysSelected}] | Today: ${tc.currentDay} -> Should Send? ${tc.expected} (Got: ${result})`);

        if (!passed) console.error("   FAIL: Logic mismatch!");
    });
}

testToggleLogic();
