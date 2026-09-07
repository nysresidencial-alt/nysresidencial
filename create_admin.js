require('dotenv').config();
const { Client } = require('pg');

async function createAdmin() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  try {
    await client.connect();
    
    // Enable pgcrypto
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    
    // Check if user exists
    const email = 'comercial@nys.cl';
    const password = 'comercialnys';
    
    const { rows } = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    let userId;
    
    if (rows.length > 0) {
      userId = rows[0].id;
      // Update password and confirm
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = crypt($1, gen_salt('bf')),
            email_confirmed_at = now()
        WHERE id = $2
      `, [password, userId]);
      console.log('User updated and confirmed!');
    } else {
      // Create user
      const res = await client.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1, crypt($2, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
        ) RETURNING id
      `, [email, password]);
      userId = res.rows[0].id;
      
      // Also insert into identities
      await client.query(`
        INSERT INTO auth.identities (
          id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, 'email', now(), now(), now()
        )
      `, [userId, email]);
      console.log('User created and confirmed!');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

createAdmin();
