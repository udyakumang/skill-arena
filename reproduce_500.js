
async function testEndpoints() {
    console.log("--- Testing User Create Edge Cases ---");

    // Test Cases
    const cases = [
        { name: "ValidUser", payload: { name: "Valid" }, expect: 200 },
        { name: "EmptyBody", payload: {}, expect: 200 }, // Anonymous?
        { name: "NullName", payload: { name: null }, expect: 200 },
        { name: "NumberName", payload: { name: 123 }, expect: 400 }, // Should catch or crash?
        { name: "BadWord", payload: { name: "admin" }, expect: 400 } // Should be blocked
    ];

    for (const c of cases) {
        process.stdout.write(`Testing ${c.name}... `);
        try {
            const res = await fetch('http://localhost:3000/api/user/create', {
                method: 'POST',
                body: JSON.stringify(c.payload),
                headers: { 'Content-Type': 'application/json' }
            });
            const text = await res.text();

            if (res.status === c.expect) {
                console.log(`✅ OK (${res.status})`);
            } else if (c.name === "NumberName" && res.status === 500) {
                console.log(`❌ CRASHED (500) -> Confirmed Bug`);
            } else {
                console.log(`⚠️ Result: ${res.status} - ${text}`);
            }
        } catch (e) {
            console.log(`❌ Network Error: ${e.message}`);
        }
    }

    // Verify Session Start Fix
    console.log("\n--- Testing Session Start Fix ---");
    try {
        const uRes = await fetch('http://localhost:3000/api/user/create', { method: 'POST', body: JSON.stringify({ name: "SessionTest" }) });
        if (uRes.ok) {
            const u = await uRes.json();
            const sRes = await fetch('http://localhost:3000/api/session/start', {
                method: 'POST',
                body: JSON.stringify({ userId: u.id }) // No type provided
            });
            console.log(`Session Start (No Type): ${sRes.status} (Expect 200)`);
        }
    } catch (e) {
        console.error("Session test failed:", e);
    }
}

testEndpoints();
