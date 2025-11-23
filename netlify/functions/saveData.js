
import { getStore } from '@netlify/blobs';

function makeStore() {
  const opts = {};
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || process.env.PROJECT_ID;
  const token  = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_TOKEN || process.env.API_TOKEN;
  if (siteID) opts.siteID = siteID;
  if (token)  opts.token  = token;
  return getStore('verdant-library', opts);
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const books = JSON.parse(event.body || '[]');
    const store = makeStore();
    await store.set('books.json', JSON.stringify(books), { consistency: 'strong' });
    return { statusCode: 200, body: 'Saved' };
  } catch (e) {
    return { statusCode: 500, body: String(e) };
  }
}
