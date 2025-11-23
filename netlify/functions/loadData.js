
import { getStore } from '@netlify/blobs';

export async function handler() {
  try {
    const store = getStore('verdant-library');
    const value = await store.get('books.json');
    if (value) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: value
      };
    }
    // Fallback: serve seeded JSON from repository
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'library.json');
    const seed = fs.readFileSync(filePath, 'utf-8');
    // Seed into blobs for next time
    await store.set('books.json', seed, { consistency: 'strong' });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: seed
    };
  } catch (e) {
    return { statusCode: 500, body: String(e) };
  }
}
