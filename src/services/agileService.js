import { supabase } from "../config/supabase";

export async function getAgileProjects() {
  const { data, error } = await supabase.from("agile_projects").select("*,agile_tasks(*)").order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createAgileProject(project) {
  const { data, error } = await supabase.from("agile_projects").insert({ name: project.name, description: project.description || "", status: project.status || "active" }).select().single();
  if (error) throw error;
  return data;
}

export async function updateAgileProject(id, patch) {
  const { data, error } = await supabase.from("agile_projects").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function createAgileTask(task) {
  const { data, error } = await supabase.from("agile_tasks").insert({ project_id: task.project_id, title: task.title, description: task.description || "", status: task.status || "backlog", priority: task.priority || "medium", owner_id: task.owner_id || null, due_date: task.due_date || null }).select().single();
  if (error) throw error;
  return data;
}

export async function updateAgileTask(id, patch) {
  const { data, error } = await supabase.from("agile_tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAgileTask(id) {
  const { error } = await supabase.from("agile_tasks").delete().eq("id", id);
  if (error) throw error;
  return true;
}
