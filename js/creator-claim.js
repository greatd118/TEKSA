// ============================================
// TEKSA — Klaim Jabatan Creator (halaman rahasia)
//
// Keamanan yang diterapkan (dan batasannya, dicatat jujur):
//   - Master key TIDAK disimpan plain text, hanya hash SHA-256-nya.
//     Namun karena ini client-side, hash tetap bisa dilihat lewat
//     view-source. Ini menaikkan usaha untuk brute-force, bukan
//     proteksi kriptografis penuh.
//   - Sanitasi input mencegah XSS (karakter HTML di-escape sebelum
//     disimpan/ditampilkan). SQL injection tidak relevan di sini
//     karena kita pakai Firestore (NoSQL), bukan database SQL.
//   - Rate limit bersifat "soft": dibatasi lewat localStorage per
//     perangkat, bukan per-IP di server. Cukup untuk mencegah spam
//     klik biasa, tapi bisa di-bypass dengan clear storage/incognito.
//   - Klaim creator hanya bisa terjadi SEKALI: begitu ada satu akun
//     dengan title "creator" di Firestore, form ini akan menolak
//     percobaan berikutnya walau kunci akses benar.
// ============================================

import { dbProfil } from './firebase-config.js';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const MASTER_KEY_HASH = 'ceb105965c969399d73bef2632e0d1218e1508c3f3057e9e06989c4b694d51c2';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 menit

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Sanitasi dasar: escape karakter HTML agar tidak bisa inject script/tag
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-msg ' + (type === 'error' ? 'is-error' : 'is-success');
}

// ---------- Rate limiting (soft, localStorage-based) ----------

function getAttemptState() {
  const raw = localStorage.getItem('teksa_creator_attempts');
  return raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 };
}

function recordAttempt(success) {
  const state = getAttemptState();
  if (success) {
    localStorage.removeItem('teksa_creator_attempts');
    return;
  }
  state.count += 1;
  if (state.count >= MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOCKOUT_MS;
    state.count = 0;
  }
  localStorage.setItem('teksa_creator_attempts', JSON.stringify(state));
}

function isLockedOut() {
  const state = getAttemptState();
  return state.lockedUntil && Date.now() < state.lockedUntil;
}

function remainingLockoutMinutes() {
  const state = getAttemptState();
  return Math.ceil((state.lockedUntil - Date.now()) / 60000);
}

// ---------- Form handling ----------

const form = document.getElementById('creatorForm');
const msgEl = document.getElementById('formMsg');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isLockedOut()) {
    showMsg(msgEl, `Terlalu banyak percobaan gagal. Coba lagi dalam ${remainingLockoutMinutes()} menit.`, 'error');
    return;
  }

  const rawKey = document.getElementById('masterKey').value;
  const rawUsername = document.getElementById('creatorUsername').value.trim().toLowerCase();
  const username = sanitize(rawUsername);

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    showMsg(msgEl, 'Username tidak valid.', 'error');
    return;
  }

  submitBtn.disabled = true;

  try {
    // 1. Cek apakah creator sudah pernah diklaim
    const existingQuery = query(collection(dbProfil, 'profiles'), where('title', '==', 'creator'));
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      showMsg(msgEl, 'Jabatan creator sudah diklaim sebelumnya. Tidak bisa diklaim ulang.', 'error');
      submitBtn.disabled = false;
      return;
    }

    // 2. Verifikasi master key
    const inputHash = await sha256(rawKey);
    if (inputHash !== MASTER_KEY_HASH) {
      recordAttempt(false);
      showMsg(msgEl, 'Kunci akses salah.', 'error');
      submitBtn.disabled = false;
      return;
    }

    // 3. Cek akun tujuan ada
    const profileRef = doc(dbProfil, 'profiles', username);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      showMsg(msgEl, 'Akun dengan username itu belum terdaftar. Daftar dulu lewat halaman Akun.', 'error');
      submitBtn.disabled = false;
      return;
    }

    // 4. Set title creator
    await setDoc(profileRef, { title: 'creator', updatedAt: Date.now() }, { merge: true });

    recordAttempt(true);
    showMsg(msgEl, 'Berhasil! Jabatan creator sudah diklaim untuk akun ini.', 'success');
    form.reset();
  } catch (err) {
    console.error(err);
    showMsg(msgEl, 'Terjadi kesalahan. Coba lagi nanti.', 'error');
  }
  submitBtn.disabled = false;
});
