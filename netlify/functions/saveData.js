
import { promises as fs } from 'fs';
import path from 'path';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const books = JSON.parse(event.body);
    const filePath = path.join(process.cwd(), 'data', 'library.json');
    await fs.writeFile(filePath, JSON.stringify(books, null, 2));
    return { statusCode: 200, body: 'Saved' };
  } catch (e) {
    return { statusCode: 500, body: e.toString() };
  }
}
