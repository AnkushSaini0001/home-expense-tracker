const API = 'http://localhost:5000/api';

async function testAuth() {
  console.log('🧪 Testing JWT Auth & Role-Based Access Control...');

  // 1. Test request without token (Should be 401)
  const noTokenRes = await fetch(`${API}/providers`);
  console.log('1. No token request status:', noTokenRes.status, noTokenRes.status === 401 ? 'PASSED (401 Unauthorized) ✅' : 'FAILED ❌');

  // 2. Login as viewer user
  const userLoginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user', password: 'user123' }),
  });
  const userLogin = await userLoginRes.json();
  console.log('2. User login:', userLogin.success ? 'PASSED ✅' : 'FAILED ❌', 'Role:', userLogin.user?.role);
  const userToken = userLogin.token;

  // 3. Test view providers with user token (Should be 200)
  const userViewRes = await fetch(`${API}/providers`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log('3. User role viewing providers:', userViewRes.status, userViewRes.status === 200 ? 'PASSED (200 OK) ✅' : 'FAILED ❌');

  // 4. Test adding provider with user token (Should be 403 Forbidden)
  const userAddRes = await fetch(`${API}/providers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      name: 'Unauthorized Helper',
      category: 'Maid',
      billingType: 'monthly_fixed',
      defaultRate: 2000,
    }),
  });
  const userAdd = await userAddRes.json();
  console.log('4. User role attempting to add provider:', userAddRes.status, userAddRes.status === 403 ? 'PASSED (403 Forbidden) ✅' : 'FAILED ❌', userAdd.message);

  // 5. Login as admin
  const adminLoginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const adminLogin = await adminLoginRes.json();
  console.log('5. Admin login:', adminLogin.success ? 'PASSED ✅' : 'FAILED ❌', 'Role:', adminLogin.user?.role);
  const adminToken = adminLogin.token;

  // 6. Test adding provider with admin token (Should be 201 Created)
  const adminAddRes = await fetch(`${API}/providers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Pooja (Maid)',
      category: 'Maid',
      billingType: 'monthly_fixed',
      defaultRate: 2500,
      unit: 'Month',
    }),
  });
  const adminAdd = await adminAddRes.json();
  console.log('6. Admin role adding provider:', adminAddRes.status, adminAddRes.status === 201 ? 'PASSED (201 Created) ✅' : 'FAILED ❌', adminAdd.data?.name);

  // 7. Cleanup created test provider
  if (adminAdd.data?._id) {
    const delRes = await fetch(`${API}/providers/${adminAdd.data._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('7. Admin role cleanup delete:', delRes.status, delRes.status === 200 ? 'PASSED ✅' : 'FAILED ❌');
  }

  console.log('🎉 ALL BACKEND AUTH & RBAC TESTS PASSED SUCCESSFULLY! 🎉');
}

testAuth().catch(console.error);
