async function check() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/system/local-ip');
    const data = await res.json();
    console.log('System Info:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
check();
