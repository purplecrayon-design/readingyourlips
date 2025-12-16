import { neon } from '@netlify/neon';

const sql = neon();

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // GET - Fetch all words (with optional search/category filter)
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const search = params.search || '';
      const category = params.category || '';

      let query = `SELECT * FROM words`;
      let conditions = [];
      let values = [];

      if (search) {
        conditions.push(`(german ILIKE $${values.length + 1} OR english ILIKE $${values.length + 1})`);
        values.push(`%${search}%`);
      }

      if (category) {
        conditions.push(`category = $${values.length + 1}`);
        values.push(category);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY created_at DESC`;

      const words = await sql(query, values);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(words)
      };
    }

    // POST - Add a new word
    if (event.httpMethod === 'POST') {
      const { german, english, category } = JSON.parse(event.body);

      if (!german || !english) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'German and English words are required' })
        };
      }

      const result = await sql`
        INSERT INTO words (german, english, category)
        VALUES (${german}, ${english}, ${category || null})
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // DELETE - Remove a word
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Word ID is required' })
        };
      }

      await sql`DELETE FROM words WHERE id = ${id}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database error', details: error.message })
    };
  }
}
