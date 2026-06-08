import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { html } = await request.json();
    if (!html) {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }

    const publicPath = path.join(process.cwd(), 'public', 'maps', 'route.html');
    
    // Ensure directories exist
    await fs.mkdir(path.dirname(publicPath), { recursive: true });
    
    // Write map content
    await fs.writeFile(publicPath, html, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
