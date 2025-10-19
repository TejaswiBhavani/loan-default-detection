#!/usr/bin/env node
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function updateAdminPassword() {
  const pool = new Pool({
    host: process.env.DB_HOST || '/var/run/postgresql',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'loan_prediction_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const newPassword = 'Admin123!@#';
    const hash = await bcrypt.hash(newPassword, 12);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username, email',
      [hash, 'admin']
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully');
      console.log('User:', result.rows[0]);
      console.log('\nYou can now login with:');
      console.log('Username: admin');
      console.log('Password: Admin123!@#');
    } else {
      console.log('❌ Admin user not found');
    }
  } catch (error) {
    console.error('Error updating password:', error.message);
  } finally {
    await pool.end();
  }
}

updateAdminPassword();
