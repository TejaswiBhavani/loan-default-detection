#!/usr/bin/env node

// Quick script to create an admin user with known password
require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('./config/database');

async function createAdminUser() {
  console.log('🔧 Creating admin user with password: admin123');
  
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    // Check if admin already exists
    const existingUser = await query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (existingUser.rows.length > 0) {
      // Update existing admin password
      await query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
      console.log('✅ Updated admin password to: admin123');
    } else {
      // Create new admin user
      await query(`
        INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, department, phone, is_verified) 
        VALUES (gen_random_uuid(), 'admin', 'admin@example.com', $1, 'Admin', 'User', 'admin', 'IT', '+1-555-0000', true)
      `, [hashedPassword]);
      console.log('✅ Created new admin user with password: admin123');
    }
    
    console.log('');
    console.log('🎯 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createAdminUser();