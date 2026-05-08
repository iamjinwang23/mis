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

export async function saveReport({ type, filename, reportDate, data }) {
  const { data: row, error } = await supabase
    .from('reports')
    .insert({
      type,
      filename,
      report_date: reportDate instanceof Date ? reportDate.toISOString().slice(0, 10) : reportDate,
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
