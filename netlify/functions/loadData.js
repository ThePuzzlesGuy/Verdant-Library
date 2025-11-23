
import { getStore } from '@netlify/blobs';

function makeStore() {
  const opts = {};
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.PROJECT_ID;
  const token  = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN || process.env.API_TOKEN;
  if (siteID) opts.siteID = siteID;
  if (token)  opts.token  = token;
  return getStore('verdant-library', opts);
}

export async function handler() {
  try {
    const store = makeStore();
    let value = await store.get('books.json');
    if (value && typeof value === 'string' && value.trim().length > 2) {
      try {
        JSON.parse(value);
        return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: value };
      } catch {}
    }
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'library.json');
    const seed = fs.readFileSync(filePath, 'utf-8');
    await store.set('books.json', seed, { consistency: 'strong' });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: seed };
  } catch (e) {
    // Last-ditch: serve static file so UI isn't empty
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'data', 'library.json');
      const seed = fs.readFileSync(filePath, 'utf-8');
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: seed };
    } catch {}
    return { statusCode: 500, body: String(e) };
  }
}
