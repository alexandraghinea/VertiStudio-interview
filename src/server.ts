import { serve } from 'bun';
import { Database } from 'bun:sqlite';
import { createHash } from 'crypto';
import { seedDatabase } from './seed';
import { Transaction } from './types';

// Create a persistent database
const db = new Database('bitslow.db');

// Define holding type
interface Holding {
  coin_id: number;
  bit1: number;
  bit2: number;
  bit3: number;
  value: number;
}

// Initialize database schema and seed with test data
console.log('Initializing database...');
seedDatabase(db, {
  clientCount: 5,
  bitSlowCount: 10,
  transactionCount: 20,
  clearExisting: true  // This will ensure we start with a fresh database
});
console.log('Database initialization complete');

const server = serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);
    console.log(`${req.method} ${url.pathname}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
      // Handle registration endpoint
      if (url.pathname === '/api/register' && req.method === 'POST') {
        let body;
        try {
          body = await req.json();
          console.log('Registration request:', body);
        } catch (e) {
          console.error('Failed to parse request body:', e);
          return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        try {
          // Check if email already exists
          const existingUser = db.query('SELECT id FROM clients WHERE email = ?').get(body.email);
          if (existingUser) {
            throw new Error('Email already registered');
          }

          // Hash the password
          const hashedPassword = createHash('sha256').update(body.password).digest('hex');

          // Insert the new user
          const result = db.query(`
            INSERT INTO clients (name, email, password_hash, phone, address)
            VALUES (?, ?, ?, NULL, NULL)
          `).run(body.name, body.email, hashedPassword);

          const user = {
            id: result.lastInsertRowid,
            name: body.name,
            email: body.email,
          };

          console.log('Registration successful:', user);
          
          return new Response(JSON.stringify(user), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Registration failed:', e);
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Registration failed' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle login endpoint
      if (url.pathname === '/api/login' && req.method === 'POST') {
        let body;
        try {
          body = await req.json();
          console.log('Login request:', body);
        } catch (e) {
          console.error('Failed to parse request body:', e);
          return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        try {
          // Hash the provided password using the same method as in seed.ts
          const hashedPassword = createHash('sha256').update(body.password).digest('hex');
          console.log('Attempting login with:', { email: body.email, hashedPassword });

          // First, check if the user exists
          const user = db.query(`
            SELECT id, name, email, password_hash
            FROM clients
            WHERE email = ?
          `).get(body.email) as { id: number; name: string; email: string; password_hash: string } | null;

          console.log('Found user:', user);

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Compare password hashes
          if (user.password_hash !== hashedPassword) {
            console.log('Password mismatch. Expected:', user.password_hash, 'Got:', hashedPassword);
            throw new Error('Invalid email or password');
          }

          // Remove password_hash from response
          const { password_hash, ...userWithoutPassword } = user;
          console.log('Login successful:', userWithoutPassword);
          
          return new Response(JSON.stringify(userWithoutPassword), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Login failed:', e);
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Login failed' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle user profile endpoint
      if (url.pathname.startsWith('/api/profile/') && req.method === 'GET') {
        const userId = parseInt(url.pathname.split('/')[3]);
        if (isNaN(userId)) {
          return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        try {
          // Get user's total transactions
          const totalTransactions = db.query(`
            SELECT COUNT(*) as count
            FROM transactions
            WHERE buyer_id = ? OR seller_id = ?
          `).get(userId, userId) as { count: number };

          // Get user's BitSlow holdings (coins they bought and haven't sold)
          const holdings = db.query(`
            SELECT DISTINCT
              c.coin_id,
              c.bit1,
              c.bit2,
              c.bit3,
              c.value
            FROM coins c
            INNER JOIN transactions t1 ON c.coin_id = t1.coin_id
            WHERE t1.buyer_id = ?
            AND NOT EXISTS (
              SELECT 1
              FROM transactions t2
              WHERE t2.coin_id = c.coin_id
              AND t2.seller_id = ?
              AND t2.transaction_date > t1.transaction_date
            )
          `).all(userId, userId) as Holding[];

          // Calculate total value
          const totalValue = holdings.reduce((sum, coin) => sum + coin.value, 0);

          const profile = {
            totalTransactions: totalTransactions.count,
            totalBitSlows: holdings.length,
            totalValue,
            holdings: holdings.map(coin => ({
              ...coin,
              computedBitSlow: createHash('md5')
                .update(`${coin.bit1},${coin.bit2},${coin.bit3}`)
                .digest('hex')
            }))
          };

          return new Response(JSON.stringify(profile), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Failed to fetch profile:', e);
          return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle transactions endpoint
      if (url.pathname === '/api/transactions' && req.method === 'GET') {
        const rawTransactions = db.query(`
          SELECT 
            t.id,
            t.coin_id,
            t.amount,
            t.transaction_date,
            t.seller_id,
            s.name as seller_name,
            t.buyer_id,
            b.name as buyer_name,
            c.bit1,
            c.bit2,
            c.bit3,
            c.value
          FROM transactions t
          JOIN clients b ON t.buyer_id = b.id
          LEFT JOIN clients s ON t.seller_id = s.id
          JOIN coins c ON t.coin_id = c.coin_id
          ORDER BY t.transaction_date DESC
        `).all() as Transaction[];

        // Add computed BitSlow for each transaction
        const enhancedTransactions = rawTransactions.map(t => ({
          ...t,
          computedBitSlow: createHash('md5')
            .update(`${t.bit1},${t.bit2},${t.bit3}`)
            .digest('hex')
        }));

        return new Response(JSON.stringify(enhancedTransactions), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Debug endpoint to list users (REMOVE IN PRODUCTION)
      if (url.pathname === '/api/debug/users' && req.method === 'GET') {
        try {
          const users = db.query(`
            SELECT id, name, email
            FROM clients
            LIMIT 10
          `).all();

          return new Response(JSON.stringify(users), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Failed to fetch users:', e);
          return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle BitSlow listing endpoint
      if (url.pathname === '/api/bitslows' && req.method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '30');
        const offset = (page - 1) * limit;

        try {
          // Get total count
          const totalCount = db.query('SELECT COUNT(*) as count FROM coins').get() as { count: number };

          // Get paginated BitSlows
          const bitslows = db.query(`
            SELECT 
              c.coin_id as id,
              c.bit1,
              c.bit2,
              c.bit3,
              c.value as monetaryValue,
              (
                SELECT cl.name
                FROM transactions t
                JOIN clients cl ON t.buyer_id = cl.id
                WHERE t.coin_id = c.coin_id
                ORDER BY t.transaction_date DESC
                LIMIT 1
              ) as currentOwner
            FROM coins c
            LIMIT ? OFFSET ?
          `).all(limit, offset) as any[];

          // Add computed hash for each BitSlow
          const enhancedBitslows = bitslows.map(bitslow => ({
            ...bitslow,
            hash: createHash('md5')
              .update(`${bitslow.bit1},${bitslow.bit2},${bitslow.bit3}`)
              .digest('hex'),
            componentNumbers: [bitslow.bit1, bitslow.bit2, bitslow.bit3]
          }));

          return new Response(JSON.stringify({
            bitslows: enhancedBitslows,
            total: totalCount.count,
            page,
            limit
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Failed to fetch BitSlows:', e);
          return new Response(JSON.stringify({ error: 'Failed to fetch BitSlows' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle BitSlow purchase endpoint
      if (url.pathname.match(/^\/api\/bitslows\/\d+\/buy$/) && req.method === 'POST') {
        const bitslowId = parseInt(url.pathname.split('/')[3]);
        
        try {
          // Check if BitSlow exists
          const bitslow = db.query('SELECT coin_id FROM coins WHERE coin_id = ?').get(bitslowId);
          if (!bitslow) {
            throw new Error('BitSlow not found');
          }

          // Get current owner (if any)
          const currentOwner = db.query(`
            SELECT buyer_id
            FROM transactions
            WHERE coin_id = ?
            ORDER BY transaction_date DESC
            LIMIT 1
          `).get(bitslowId) as { buyer_id: number } | null;

          // For demo purposes, we'll use a fixed buyer ID (you should get this from authentication)
          const buyerId = 1; // TODO: Get from authenticated user

          // Insert new transaction
          const sellerId = currentOwner?.buyer_id ?? null;
          db.query(`
            INSERT INTO transactions (coin_id, seller_id, buyer_id, amount, transaction_date)
            VALUES (?, ?, ?, (SELECT value FROM coins WHERE coin_id = ?), datetime('now'))
          `).run(
            Number(bitslowId),
            sellerId,
            Number(buyerId),
            Number(bitslowId)
          );

          return new Response(JSON.stringify({ success: true }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Failed to purchase BitSlow:', e);
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to purchase BitSlow' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle BitSlow generation endpoint
      if (url.pathname === '/api/bitslows/generate' && req.method === 'POST') {
        try {
          const body = await req.json();
          const amount = parseFloat(body.amount);

          if (isNaN(amount) || amount <= 0) {
            throw new Error('Invalid amount');
          }

          // Find unused combination of numbers
          const usedCombinations = db.query('SELECT bit1, bit2, bit3 FROM coins').all() as { bit1: number; bit2: number; bit3: number }[];
          const usedSet = new Set(usedCombinations.map(c => `${c.bit1},${c.bit2},${c.bit3}`));
          
          let newBit1 = Math.floor(Math.random() * 100);
          let newBit2 = Math.floor(Math.random() * 100);
          let newBit3 = Math.floor(Math.random() * 100);
          let found = false;

          // Try to find unique combination
          for (let attempts = 0; attempts < 100; attempts++) {
            if (!usedSet.has(`${newBit1},${newBit2},${newBit3}`)) {
              found = true;
              break;
            }
            newBit1 = Math.floor(Math.random() * 100);
            newBit2 = Math.floor(Math.random() * 100);
            newBit3 = Math.floor(Math.random() * 100);
          }

          if (!found) {
            throw new Error('No unique combinations available');
          }

          // Insert new coin
          const result = db.query(`
            INSERT INTO coins (bit1, bit2, bit3, value)
            VALUES (?, ?, ?, ?)
          `).run(newBit1, newBit2, newBit3, amount);

          // Create initial transaction for the coin
          const buyerId = 1; // TODO: Get from authenticated user
          db.query(`
            INSERT INTO transactions (coin_id, seller_id, buyer_id, amount, transaction_date)
            VALUES (?, NULL, ?, ?, datetime('now'))
          `).run(result.lastInsertRowid, buyerId, amount);

          return new Response(JSON.stringify({
            success: true,
            bitslow: {
              id: result.lastInsertRowid,
              componentNumbers: [newBit1, newBit2, newBit3],
              monetaryValue: amount,
              hash: createHash('md5')
                .update(`${newBit1},${newBit2},${newBit3}`)
                .digest('hex')
            }
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Failed to generate BitSlow:', e);
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Failed to generate BitSlow' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle BitSlow transaction history endpoint
      if (url.pathname.match(/^\/api\/bitslows\/\d+\/history$/) && req.method === 'GET') {
        const bitslowId = parseInt(url.pathname.split('/')[3]);
        
        try {
          const transactions = db.query(`
            SELECT 
              t.transaction_id as id,
              t.coin_id as bitslowId,
              s.name as previousOwner,
              b.name as newOwner,
              t.transaction_date as timestamp
            FROM transactions t
            LEFT JOIN clients s ON t.seller_id = s.id
            JOIN clients b ON t.buyer_id = b.id
            WHERE t.coin_id = ?
            ORDER BY t.transaction_date DESC
          `).all(bitslowId) as any[];

          return new Response(JSON.stringify(transactions), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error('Failed to fetch transaction history:', e);
          return new Response(JSON.stringify({ error: 'Failed to fetch transaction history' }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }

      // Handle 404 for unknown endpoints
      return new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      });
    } catch (error) {
      console.error('Server error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Internal Server Error',
          details: error instanceof Error ? error.stack : undefined
        }),
        {
          status: error instanceof Error && error.message.includes('already registered') ? 400 : 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`); 