// ============================================
// TEKSA — Struktur Organisasi
// Ambil data jabatan dari Firestore (collection "profiles").
// Kalau belum ada siswa yang klaim suatu jabatan, tampilkan placeholder tag.
// ============================================

import { dbProfil } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const ROLES = [
  { key: 'ketua_kelas', label: 'Ketua Kelas', placeholder: '<ketua_kelas>' },
  { key: 'wakil_ketua', label: 'Wakil Ketua', placeholder: '<wakil_ketua>' },
  { key: 'sekertaris', label: 'Sekretaris', placeholder: '<sekertaris>' },
  { key: 'bendahara', label: 'Bendahara', placeholder: '<bendahara>' },
];

async function loadRole(roleKey) {
  try {
    const q = query(collection(dbProfil, 'profiles'), where('title', '==', roleKey));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      return data.name || null;
    }
  } catch (err) {
    console.warn('Gagal ambil data jabatan', roleKey, err);
  }
  return null;
}

async function renderStruktur() {
  for (const role of ROLES) {
    const el = document.querySelector(`[data-role="${role.key}"]`);
    if (!el) continue;
    const name = await loadRole(role.key);
    if (name) {
      el.textContent = name;
      el.classList.remove('is-placeholder');
    } else {
      el.textContent = role.placeholder;
      el.classList.add('is-placeholder');
    }
  }
}

renderStruktur();
