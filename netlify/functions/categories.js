import { neon } from '@netlify/neon';

const sql = neon();

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    // GET - Fetch all categories
    if (event.httpMethod === 'GET') {
      const categories = await sql`SELECT * FROM categories ORDER BY name ASC`;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(categories)
      };
    }

    // POST - Add a new category
    if (event.httpMethod === 'POST') {
      const { name, color } = JSON.parse(event.body);

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Category name is required' })
        };
      }

      const result = await sql`
        INSERT INTO categories (name, color)
        VALUES (${name}, ${color || '#8B9D83'})
        RETURNING *
      `;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // DELETE - Remove a category
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Category ID is required' })
        };
      }

      // First, set words with this category to null
      await sql`UPDATE words SET category = null WHERE category = ${id}`;
      await sql`DELETE FROM categories WHERE id = ${id}`;

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
