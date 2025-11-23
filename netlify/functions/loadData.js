
import { getStore } from '@netlify/blobs';

export async function handler() {
  try {
    const store = getStore('verdant-library');
    let value = await store.get('books.json');
    // Treat empty/whitespace as empty
    if (value && typeof value === 'string' && value.trim().length > 2) {
      // Ensure valid JSON
      try {
        JSON.parse(value);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: value
        };
      } catch {}
    }
    // Fallback: serve seeded JSON from repository and prime blobs
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'library.json');
    const seed = fs.readFileSync(filePath, 'utf-8');
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
