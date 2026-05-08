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
  };
}

function toLocalDateStr(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

export async function saveReport({ type, filename, reportDate, data }) {
  const { data: row, error } = await supabase
    .from('reports')
    .insert({
      type,
      filename,
      report_date: toLocalDateStr(reportDate),
      data,
    })
    .select()
    .single();
  if (error) throw error;
  return row.id;
}

export async function listReports(type) {
  let query = supabase
    .from('reports')
    .select('id, type, filename, report_date, uploaded_at, data')
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
