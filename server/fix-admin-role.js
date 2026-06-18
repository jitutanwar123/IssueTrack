import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Fix name for cristiano7@gmail.com
await db.execute(
  "UPDATE users SET name = 'Cristiano Ronaldo' WHERE email = 'cristiano7@gmail.com'"
);
console.log("✅ Name updated to Cristiano Ronaldo");

const [rows] = await db.execute(
  "SELECT id, name, email, phone, department, portal_role FROM users WHERE email = 'cristiano7@gmail.com'"
);
console.table(rows);
await db.end();
