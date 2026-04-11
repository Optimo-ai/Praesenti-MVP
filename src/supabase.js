const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const fetchChecklist = async (casoId) => {
  if (!SUPA_URL || !SUPA_KEY || !casoId) return null;
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/checklist?caso_id=eq.${casoId}&select=*`, {
      headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
    });
    const data = await res.json();
    if (data.error) throw data.error;
    return data && data[0] ? data[0] : null;
  } catch (e) {
    console.warn("fetchChecklist error:", e);
    return null;
  }
};

export const saveChecklist = async (casoId, items, coordinatorId) => {
  if (!SUPA_URL || !SUPA_KEY || !casoId) return;
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/checklist?caso_id=eq.${casoId}&select=checklist_id`, {
      headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
    });
    const data = await res.json();
    const existingId = data && data[0] ? data[0].checklist_id : null;
    const isFull = Array.isArray(items) && items.length > 0 && items.every(v => v === true);
    if (existingId) {
      await fetch(`${SUPA_URL}/rest/v1/checklist?checklist_id=eq.${existingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=minimal" },
        body: JSON.stringify({ items, completado_por: coordinatorId, completado: isFull, fecha_completado: isFull ? new Date().toISOString() : null })
      });
    } else {
      await fetch(`${SUPA_URL}/rest/v1/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=minimal" },
        body: JSON.stringify({ caso_id: casoId, items, completado_por: coordinatorId, tipo: "recovery", completado: isFull, fecha_completado: isFull ? new Date().toISOString() : null })
      });
    }
  } catch (e) {
    console.error("saveChecklist error:", e);
  }
};

export const fetchDocuments = async (casoId, authUserId) => {
  if (!SUPA_URL || !SUPA_KEY) return [];
  try {
    let allDocs = [];
    if (casoId) {
      const res = await fetch(`${SUPA_URL}/rest/v1/documentos?caso_id=eq.${casoId}&select=*`, {
        headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
      });
      const data = await res.json();
      if (Array.isArray(data)) allDocs = data;
    } else if (authUserId) {
      const local = localStorage.getItem("demo_docs_" + authUserId);
      if (local) allDocs = JSON.parse(local);
    }
    return allDocs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (e) {
    console.warn("fetchDocuments error:", e);
    return [];
  }
};

export const uploadDocument = async (casoId, file, authUserId, reqType) => {
  if (!SUPA_URL || !SUPA_KEY || !file) return null;
  const effectiveId = casoId || authUserId || "pending";
  try {
    const rand = Math.random().toString(36).substring(2, 9);
    const fileName = `${effectiveId}/${rand}-${file.name}`;
    const storageRes = await fetch(`${SUPA_URL}/storage/v1/object/paciente_docs/${fileName}`, {
      method: "POST",
      headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Content-Type": file.type || "application/octet-stream" },
      body: file
    });
    if (!storageRes.ok) throw new Error("Storage upload failed");
    const publicUrl = `${SUPA_URL}/storage/v1/object/public/paciente_docs/${fileName}`;
    const sizeStr = (file.size / 1024).toFixed(0) + " KB";
    const docMeta = { name: file.name, size: sizeStr, url: publicUrl, req_type: reqType || file.name, created_at: new Date().toISOString() };
    if (casoId) {
      const res = await fetch(`${SUPA_URL}/rest/v1/documentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=representation" },
        body: JSON.stringify({ caso_id: casoId, name: docMeta.name, size: docMeta.size, url: docMeta.url, req_type: docMeta.req_type })
      });
      const dbRes = await res.json();
      if (dbRes && dbRes[0]) docMeta.id = dbRes[0].id;
    } else if (authUserId) {
      const local = localStorage.getItem("demo_docs_" + authUserId);
      const arr = local ? JSON.parse(local) : [];
      arr.push({ ...docMeta, id: rand });
      localStorage.setItem("demo_docs_" + authUserId, JSON.stringify(arr));
    }
    return docMeta;
  } catch (e) {
    console.error("uploadDocument error:", e);
    return null;
  }
};

export const deleteDocument = async (docId, url, authUserId) => {
  if (!SUPA_URL || !SUPA_KEY || !url) return false;
  try {
    const path = url.split("/paciente_docs/")[1];
    if (path) {
      await fetch(`${SUPA_URL}/storage/v1/object/paciente_docs/${path}`, {
        method: "DELETE",
        headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
      });
    }
    if (docId && docId.length > 20) {
      await fetch(`${SUPA_URL}/rest/v1/documentos?id=eq.${docId}`, {
        method: "DELETE",
        headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
      });
    }
    if (authUserId) {
      const local = localStorage.getItem("demo_docs_" + authUserId);
      if (local) {
        const arr = JSON.parse(local).filter(d => d.url !== url && d.id !== docId);
        localStorage.setItem("demo_docs_" + authUserId, JSON.stringify(arr));
      }
    }
    return true;
  } catch (e) {
    console.error("deleteDocument error:", e);
    return false;
  }
};