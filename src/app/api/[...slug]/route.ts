import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { Registry } from '@/core/ModuleRegistry';

// We need to import all modules here to trigger their registration
// In a real plugin system this might be dynamically resolved or generated at build time
import '@/modules/customers/index';
// import '@/modules/orders/index';

async function handleRequest(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const method = req.method;
  const p = await params;
  const path = '/' + p.slug.join('/');
  
  const routes = Registry.getRoutes();
  const route = routes.find(
    (r) => r.method === method && r.path === path
  );

  if (!route) {
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  }

  try {
    return await route.handler(req as unknown as Request, NextResponse);
  } catch (error: any) {
    console.error(`Error handling ${method} ${path}:`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) { return handleRequest(req, context); }
export async function POST(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) { return handleRequest(req, context); }
export async function PUT(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) { return handleRequest(req, context); }
export async function DELETE(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) { return handleRequest(req, context); }
export async function PATCH(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) { return handleRequest(req, context); }
