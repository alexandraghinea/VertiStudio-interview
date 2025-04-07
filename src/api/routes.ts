import { Database } from 'bun:sqlite';
import { createHash } from 'crypto';

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function registerUser(db: Database, userData: RegisterUserData) {
  // Check if email already exists
  const existingUser = db.query('SELECT id FROM clients WHERE email = ?').get(userData.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash the password
  const hashedPassword = hashPassword(userData.password);

  // Insert the new user
  const result = db.query(`
    INSERT INTO clients (name, email, password_hash, phone, address)
    VALUES (?, ?, ?, NULL, NULL)
  `).run(userData.name, userData.email, hashedPassword);

  return {
    id: result.lastInsertRowid,
    name: userData.name,
    email: userData.email,
  };
} 