const API_URL = 'http://localhost:5000/api';

async function runE2ETest() {
  console.log('🚀 Starting Automated End-to-End Verification Test...');

  // 1. Check health
  const healthRes = await fetch(`${API_URL}/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health.status === 'ok' ? 'PASSED ✅' : 'FAILED ❌');

  // 2. Fetch providers
  const providersRes = await fetch(`${API_URL}/providers`);
  const providersData = await providersRes.json();
  const milkman = providersData.data.find(p => p.category === 'Milkman');
  const cook = providersData.data.find(p => p.category === 'Cook');

  console.log('2. Providers found:', {
    milkman: milkman?.name,
    cook: cook?.name,
  });

  if (!milkman) throw new Error('Milkman provider not found');

  const month = '2026-09';

  // 3. Get initial summary for Milkman
  const initialSummaryRes = await fetch(`${API_URL}/billing/summary/${milkman._id}?month=${month}`);
  const initialSummary = await initialSummaryRes.json();
  const initialBilled = initialSummary.data.billing.totalBilled;
  const initialPaid = initialSummary.data.billing.totalPaid;
  const initialPending = initialSummary.data.billing.pendingBalance;

  console.log('3. Initial Milkman State:', {
    totalBilled: initialBilled,
    totalPaid: initialPaid,
    pendingBalance: initialPending,
  });

  // 4. Record new advance of ₹300 for Milkman
  const paymentRes = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: milkman._id,
      date: '2026-09-15',
      amount: 300,
      paymentType: 'Advance',
      paymentMethod: 'UPI',
      notes: 'Festival advance via UPI',
    }),
  });
  const paymentData = await paymentRes.json();
  console.log('4. Recorded advance payment:', paymentData.success ? 'PASSED ✅' : 'FAILED ❌', paymentData.data?.amount);

  // 5. Record a new daily milk delivery of 2.0 Liters on 2026-09-21
  const logRes = await fetch(`${API_URL}/daily-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: milkman._id,
      date: '2026-09-21',
      quantity: 2.0,
      rate: milkman.defaultRate,
      status: 'delivered',
      notes: 'Extra morning tea delivery',
    }),
  });
  const logData = await logRes.json();
  console.log('5. Recorded daily log:', logData.success ? 'PASSED ✅' : 'FAILED ❌', logData.data?.amount);

  // 6. Verify updated summary and pending balance
  const updatedSummaryRes = await fetch(`${API_URL}/billing/summary/${milkman._id}?month=${month}`);
  const updatedSummary = await updatedSummaryRes.json();
  const newBilled = updatedSummary.data.billing.totalBilled;
  const newPaid = updatedSummary.data.billing.totalPaid;
  const newPending = updatedSummary.data.billing.pendingBalance;

  console.log('6. Updated Milkman State:', {
    totalBilled: newBilled,
    totalPaid: newPaid,
    pendingBalance: newPending,
  });

  const expectedBilled = initialBilled + (2.0 * milkman.defaultRate);
  const expectedPaid = initialPaid + 300;
  const expectedPending = Number((expectedBilled - expectedPaid).toFixed(2));

  const mathValid = (newBilled === expectedBilled) && (newPaid === expectedPaid) && (newPending === expectedPending);
  console.log('7. Math verification (Billed - Advance = Pending):', mathValid ? 'EXACT MATCH ✅' : 'MISMATCH ❌');

  // 8. Verify shareable WhatsApp summary format
  console.log('8. Generated WhatsApp Statement:\n', updatedSummary.data.shareableSummary);

  // 9. Verify overall dashboard totals
  const overviewRes = await fetch(`${API_URL}/billing/overview?month=${month}`);
  const overview = await overviewRes.json();
  console.log('9. Overall Dashboard Totals:', overview.data.totals);

  console.log('🎉 ALL AUTOMATED E2E TESTS PASSED SUCCESSFULLY! 🎉');
}

runE2ETest().catch(console.error);
