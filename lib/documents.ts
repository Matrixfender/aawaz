import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface DocumentItem {
  id: string;
  user_id: string;
  type: 'notes' | 'letter';
  title: string;
  input_mode: 'voice' | 'text';
  transcript?: string | null;
  input_language?: string | null;
  output_language?: string | null;
  letter_type?: string | null;
  tone?: string | null;
  result: any;
  created_at: string;
}

const LOCAL_DOCS_KEY = 'aawaz_saved_documents';

export async function saveDocument(
  doc: Omit<DocumentItem, 'id' | 'created_at' | 'user_id'>,
  userId: string
): Promise<DocumentItem> {
  const isDemo = !isSupabaseConfigured();

  if (isDemo) {
    const newItem: DocumentItem = {
      ...doc,
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_DOCS_KEY);
      const docs: DocumentItem[] = stored ? JSON.parse(stored) : [];
      docs.unshift(newItem);
      localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
    }
    return newItem;
  }

  const supabase = createClient();
  if (!supabase) throw new Error('Supabase not available');

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      type: doc.type,
      title: doc.title,
      input_mode: doc.input_mode,
      transcript: doc.transcript || null,
      input_language: doc.input_language || null,
      output_language: doc.output_language || null,
      letter_type: doc.letter_type || null,
      tone: doc.tone || null,
      result: doc.result,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchDocuments(
  userId: string,
  options?: {
    type?: 'notes' | 'letter' | 'all';
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ documents: DocumentItem[]; total: number }> {
  const isDemo = !isSupabaseConfigured();
  const typeFilter = options?.type || 'all';
  const search = options?.search?.toLowerCase().trim() || '';
  const limit = options?.limit || 20;
  const page = options?.page || 1;

  if (isDemo) {
    if (typeof window === 'undefined') return { documents: [], total: 0 };
    const stored = localStorage.getItem(LOCAL_DOCS_KEY);
    let docs: DocumentItem[] = stored ? JSON.parse(stored) : [];

    if (typeFilter !== 'all') {
      docs = docs.filter((d) => d.type === typeFilter);
    }
    if (search) {
      docs = docs.filter(
        (d) =>
          d.title?.toLowerCase().includes(search) ||
          d.transcript?.toLowerCase().includes(search)
      );
    }

    const total = docs.length;
    const paginated = docs.slice((page - 1) * limit, page * limit);
    return { documents: paginated, total };
  }

  const supabase = createClient();
  if (!supabase) return { documents: [], total: 0 };

  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (typeFilter !== 'all') {
    query = query.eq('type', typeFilter);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,transcript.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return { documents: data || [], total: count || 0 };
}

export async function getDocumentById(
  id: string,
  userId: string
): Promise<DocumentItem | null> {
  const isDemo = !isSupabaseConfigured();

  if (isDemo) {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(LOCAL_DOCS_KEY);
    const docs: DocumentItem[] = stored ? JSON.parse(stored) : [];
    return docs.find((d) => d.id === id) || null;
  }

  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function deleteDocument(
  id: string,
  userId: string
): Promise<boolean> {
  const isDemo = !isSupabaseConfigured();

  if (isDemo) {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(LOCAL_DOCS_KEY);
    const docs: DocumentItem[] = stored ? JSON.parse(stored) : [];
    const filtered = docs.filter((d) => d.id !== id);
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(filtered));
    return true;
  }

  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}
