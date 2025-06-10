export default async function createAdminUser() {
  console.log("\n🔐 Creating Admin User...")
  console.log("=====================================\n")

  const email = "admin@sen.studio"
  const password = "NwO_2025"

  console.log("To create your first admin user, run this command:\n")
  
  console.log("Using curl:")
  console.log(`curl -X POST http://localhost:9000/auth/user/emailpass/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${email}",
    "password": "${password}"
  }'`)
  
  console.log("\n\nOr using httpie:")
  console.log(`http POST localhost:9000/auth/user/emailpass/register \\
  email="${email}" \\
  password="${password}"`)
  
  console.log("\n\nOr create a custom user with this Node.js script:")
  console.log(`
const fetch = require('node-fetch');

fetch('http://localhost:9000/auth/user/emailpass/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: '${email}',
    password: '${password}'
  })
})
.then(res => res.json())
.then(data => console.log('User created:', data))
.catch(err => console.error('Error:', err));
`)

  console.log("\n=====================================")
  console.log("After creating the user, login at:")
  console.log("http://localhost:9000/app")
  console.log("\nCredentials:")
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log("=====================================\n")
} 