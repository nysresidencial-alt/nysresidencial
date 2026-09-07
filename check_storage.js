require('dotenv').config();
const { Client } = require('pg');

async function checkStorage() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  try {
    await client.connect();
    // Create bucket if not exists
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('properties', 'properties', true) 
      ON CONFLICT (id) DO NOTHING;
    `);
    
    // Create policies to allow public access and authenticated uploads
    await client.query(`
      CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'properties');
      CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'properties' AND auth.role() = 'authenticated');
      CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'properties' AND auth.role() = 'authenticated');
      CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'properties' AND auth.role() = 'authenticated');
    `).catch(e => console.log('Policies might already exist', e.message));

    console.log('Bucket "properties" checked/created.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
checkStorage();
