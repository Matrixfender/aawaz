import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { fetchDocuments, saveDocument } from '@/lib/documents';
import { CreateDocumentSchema } from '@/lib/validators';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const type = (searchParams.get('type') as 'notes' | 'letter' | 'all') || 'all';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  try {
    const data = await fetchDocuments(user.id, {
      type,
      search,
      page,
      limit,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors.map((e) => e.message).join(', ') },
      { status: 400 }
    );
  }

  try {
    const document = await saveDocument(
      {
        type: parsed.data.type,
        title: parsed.data.title,
        input_mode: parsed.data.inputMode,
        transcript: parsed.data.transcript,
        input_language: parsed.data.inputLanguage,
        output_language: parsed.data.outputLanguage,
        letter_type: parsed.data.letterType,
        tone: parsed.data.tone,
        result: parsed.data.result,
      },
      user.id
    );
    return NextResponse.json({ document }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to save document' },
      { status: 500 }
    );
  }
}
