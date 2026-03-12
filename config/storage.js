/**
 * storage.js — Subida de archivos a Supabase Storage
 * Solución para entornos serverless (Vercel) donde el filesystem es read-only.
 */
require('dotenv').config();
const multer = require('multer');

// ── Multer: guardar en memoria (no en disco) ─────────────
const memStorage = multer.memoryStorage();

function createUpload(opts = {}) {
  return multer({
    storage: memStorage,
    limits: { fileSize: opts.maxSize || 8 * 1024 * 1024 },
  });
}

// ── Subir buffer a Supabase Storage ─────────────────────
async function subirArchivo(buffer, mimetype, rutaEnBucket) {
  const SUPABASE_URL    = process.env.SUPABASE_URL;
  const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const BUCKET          = process.env.SUPABASE_BUCKET || 'lotesapp';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Faltan variables SUPABASE_URL y SUPABASE_SERVICE_KEY en .env');
  }

  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${rutaEnBucket}`;

  const res = await fetch(url, {
    method : 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type' : mimetype,
      'x-upsert'     : 'true',
    },
    body: buffer,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase Storage error ${res.status}: ${txt}`);
  }

  // URL pública del archivo
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${rutaEnBucket}`;
}

module.exports = { createUpload, subirArchivo };
