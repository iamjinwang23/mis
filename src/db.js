import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL?.trim(),
  import.meta.env.VITE_SUPABASE_ANON_KEY?.replace(/\s/g, '')
);

function toRow(record) {
  return {
    ...record,
    reportDate: record.report_date,
    uploadedAt: record.uploaded_at,
    uploaderEmail: record.uploader_email ?? null,
  };
}

// ── Auth ──────────────────────────────────────────────────
export function onAuthStateChange(cb) {
  return supabase.auth.onAuthStateChange(cb);
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function toLocalDateStr(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

export async function saveReport({ type, filename, reportDate, data }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: row, error } = await supabase
    .from('reports')
    .insert({
      type,
      filename,
      report_date: toLocalDateStr(reportDate),
      data,
      uploader_email: user?.email ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row.id;
}

export async function listReports(type) {
  let query = supabase
    .from('reports')
    .select('id, type, filename, report_date, uploaded_at, uploader_email, data')
    .order('report_date', { ascending: false });
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toRow);
}

export async function getReport(id) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return toRow(data);
}

export async function deleteReport(id) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}

export async function clearAll() {
  const { error } = await supabase.from('reports').delete().neq('id', 0);
  if (error) throw error;
}

// ── Profiles ──────────────────────────────────────────────
export async function getProfile(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  if (error) throw error;
  return data;
}

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, name, position, is_admin, can_upload')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function updateCanUpload(email, canUpload) {
  const { error } = await supabase
    .from('profiles')
    .update({ can_upload: canUpload })
    .eq('email', email);
  if (error) throw error;
}

export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
