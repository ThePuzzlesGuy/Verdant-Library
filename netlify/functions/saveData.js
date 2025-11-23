
import { getStore } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const books = JSON.parse(event.body || '[]');
    const store = getStore('verdant-library');
    await store.set('books.json', JSON.stringify(books), { consistency: 'strong' });
    return { statusCode: 200, body: 'Saved' };
  } catch (e) {
    return { statusCode: 500, body: String(e) };
  }
}
