// ============================================
// TEKSA — Footer Creator Display
// Ambil nama akun yang punya title "creator" dari Firestore,
// tampilkan di footer dengan efek RGB (styling sudah ada di CSS).
// Kalau belum ada yang klaim, tetap tampilkan placeholder <creator>.
// ============================================

import { dbProfil } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

async function renderCreator() {
  const el = document.querySelector('.footer__creator');
  if (!el) return;

  try {
    const q = query(collection(dbProfil, 'profiles'), where('title', '==', 'creator'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      el.textContent = data.name || data.username || '<creator>';
    }
  } catch (err) {
    console.warn('Gagal memuat data creator', err);
  }
}

renderCreator();
