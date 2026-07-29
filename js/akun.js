// ============================================
// TEKSA — Sistem Akun (custom, tanpa Firebase Authentication)
//
// Cara kerja:
//   - Project "TEKSA Pass" (dbPass)   -> collection "credentials"
//       simpan: username, passwordHash (SHA-256), deviceId, kodeUnik
//   - Project "TEKSA Profil" (dbProfil) -> collection "profiles"
//       simpan: username, name, title, bio, photoURL (publik, bisa dibaca semua orang)
//
// Catatan keamanan:
//   - Ini BUKAN pengganti auth server sungguhan. Hash SHA-256 client-side
//     cukup untuk level proyek kelas, bukan untuk data sangat sensitif.
//   - Device ID disimpan di localStorage sebagai "soft lock" supaya satu
//     siswa idealnya cuma punya satu akun. Ini bisa di-bypass (ganti browser,
//     clear storage, dsb), jadi sifatnya pencegahan ringan saja.
// ============================================

import { dbProfil, dbPass } from './firebase-config.js';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ---------- Utilities ----------

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function getDeviceId() {
  let id = localStorage.getItem('teksa_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('teksa_device_id', id);
  }
  return id;
}

function generateUniqueCode() {
  return 'TEKSA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getSession() {
  const raw = localStorage.getItem('teksa_session');
  return raw ? JSON.parse(raw) : null;
}

function setSession(username) {
  localStorage.setItem('teksa_session', JSON.stringify({ username, at: Date.now() }));
}

function clearSession() {
  localStorage.removeItem('teksa_session');
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'form-msg ' + (type === 'error' ? 'is-error' : 'is-success');
}

// ---------- Tabs ----------

const tabs = document.querySelectorAll('.auth-tab');
const panels = document.querySelectorAll('.auth-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('is-active'));
    panels.forEach(p => p.classList.remove('is-active'));
    tab.classList.add('is-active');
    document.getElementById(tab.dataset.tab).classList.add('is-active');
  });
});

// ---------- Register ----------

const registerForm = document.getElementById('registerForm');
const registerMsg = document.getElementById('registerMsg');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const name = document.getElementById('regName').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      showMsg(registerMsg, 'Username 3-20 karakter, huruf kecil/angka/underscore saja.', 'error');
      return;
    }
    if (password.length < 6) {
      showMsg(registerMsg, 'Sandi minimal 6 karakter.', 'error');
      return;
    }

    const deviceId = getDeviceId();

    try {
      // Cek device sudah pernah daftar akun lain?
      const devQuery = query(collection(dbPass, 'credentials'), where('deviceId', '==', deviceId));
      const devSnap = await getDocs(devQuery);
      if (!devSnap.empty) {
        showMsg(registerMsg, 'Perangkat ini sudah terdaftar dengan akun lain.', 'error');
        return;
      }

      // Cek username sudah dipakai?
      const credRef = doc(dbPass, 'credentials', username);
      const credSnap = await getDoc(credRef);
      if (credSnap.exists()) {
        showMsg(registerMsg, 'Username sudah dipakai, coba yang lain.', 'error');
        return;
      }

      const passwordHash = await sha256(password);
      const kodeUnik = generateUniqueCode();

      await setDoc(credRef, {
        username, passwordHash, deviceId, kodeUnik,
        createdAt: Date.now(),
      });

      await setDoc(doc(dbProfil, 'profiles', username), {
        username, name, title: '', bio: '', photoURL: '',
        updatedAt: Date.now(),
      });

      setSession(username);
      showMsg(registerMsg, `Akun berhasil dibuat! Kode unikmu: ${kodeUnik}`, 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      console.error(err);
      showMsg(registerMsg, 'Gagal mendaftar. Coba lagi nanti.', 'error');
    }
  });
}

// ---------- Login ----------

const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    try {
      const credRef = doc(dbPass, 'credentials', username);
      const credSnap = await getDoc(credRef);
      if (!credSnap.exists()) {
        showMsg(loginMsg, 'Username tidak ditemukan.', 'error');
        return;
      }
      const data = credSnap.data();
      const passwordHash = await sha256(password);
      if (passwordHash !== data.passwordHash) {
        showMsg(loginMsg, 'Sandi salah.', 'error');
        return;
      }
      setSession(username);
      showMsg(loginMsg, 'Berhasil masuk!', 'success');
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      console.error(err);
      showMsg(loginMsg, 'Gagal masuk. Coba lagi nanti.', 'error');
    }
  });
}

// ---------- Profile (logged in view) ----------

const profileSection = document.getElementById('profileSection');
const authSection = document.getElementById('authSection');
const logoutBtn = document.getElementById('logoutBtn');
const editForm = document.getElementById('editForm');
const editMsg = document.getElementById('editMsg');

const TITLE_OPTIONS = [
  { value: '', label: 'Tidak ada' },
  { value: 'ketua_kelas', label: 'Ketua Kelas' },
  { value: 'wakil_ketua', label: 'Wakil Ketua' },
  { value: 'sekertaris', label: 'Sekretaris' },
  { value: 'bendahara', label: 'Bendahara' },
];

async function loadProfile() {
  const session = getSession();
  if (!session) {
    authSection.style.display = 'block';
    profileSection.style.display = 'none';
    return;
  }
  authSection.style.display = 'none';
  profileSection.style.display = 'block';

  const snap = await getDoc(doc(dbProfil, 'profiles', session.username));
  if (!snap.exists()) return;
  const data = snap.data();

  document.getElementById('profileName').textContent = data.name || session.username;
  document.getElementById('profileUsername').textContent = '@' + session.username;
  document.getElementById('profileBio').textContent = data.bio || 'Belum ada bio.';
  document.getElementById('profileTitleDisplay').textContent = data.title
    ? TITLE_OPTIONS.find(t => t.value === data.title)?.label || ''
    : '';

  const avatarEl = document.getElementById('profileAvatar');
  avatarEl.innerHTML = data.photoURL
    ? `<img src="${data.photoURL}" alt="${data.name}">`
    : (data.name || session.username)[0].toUpperCase();

  // Prefill edit form
  document.getElementById('editName').value = data.name || '';
  document.getElementById('editBio').value = data.bio || '';
  document.getElementById('editPhoto').value = data.photoURL || '';
  document.getElementById('editTitle').value = data.title || '';
}

if (editForm) {
  // Populate title select options
  const titleSelect = document.getElementById('editTitle');
  TITLE_OPTIONS.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    titleSelect.appendChild(o);
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const session = getSession();
    if (!session) return;

    const name = document.getElementById('editName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const photoURL = document.getElementById('editPhoto').value.trim();
    const title = document.getElementById('editTitle').value;

    try {
      // Kalau klaim title selain kosong, cek belum ada yang pegang
      if (title) {
        const q = query(collection(dbProfil, 'profiles'), where('title', '==', title));
        const snap = await getDocs(q);
        const takenByOther = snap.docs.some(d => d.id !== session.username);
        if (takenByOther) {
          showMsg(editMsg, 'Jabatan ini sudah diklaim siswa lain.', 'error');
          return;
        }
      }

      await setDoc(doc(dbProfil, 'profiles', session.username), {
        username: session.username, name, bio, photoURL, title,
        updatedAt: Date.now(),
      }, { merge: true });

      showMsg(editMsg, 'Profil berhasil diperbarui.', 'success');
      loadProfile();
    } catch (err) {
      console.error(err);
      showMsg(editMsg, 'Gagal menyimpan profil.', 'error');
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearSession();
    location.reload();
  });
}

// ---------- Search other students ----------

const searchForm = document.getElementById('profileSearchForm');
const searchResults = document.getElementById('searchResults');

if (searchForm) {
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = document.getElementById('profileSearchInput').value.trim().toLowerCase();
    if (!q) return;

    searchResults.innerHTML = '<div class="form-hint">Mencari...</div>';
    try {
      const snap = await getDocs(collection(dbProfil, 'profiles'));
      const matches = snap.docs
        .map(d => d.data())
        .filter(d => (d.name || '').toLowerCase().includes(q) || (d.username || '').toLowerCase().includes(q));

      if (matches.length === 0) {
        searchResults.innerHTML = '<div class="empty-state">Tidak ditemukan siswa dengan nama/username itu.</div>';
        return;
      }

      searchResults.innerHTML = '';
      matches.forEach(m => {
        const card = document.createElement('div');
        card.className = 'panel profile-card';
        card.innerHTML = `
          <div class="profile-card__avatar">${m.photoURL ? `<img src="${m.photoURL}" alt="${m.name}">` : (m.name || m.username)[0].toUpperCase()}</div>
          <div>
            ${m.title ? `<div class="profile-card__title">${TITLE_OPTIONS.find(t => t.value === m.title)?.label || ''}</div>` : ''}
            <div class="profile-card__name">${m.name || m.username}</div>
            <div class="form-hint">@${m.username}</div>
            <div class="profile-card__bio">${m.bio || ''}</div>
          </div>
        `;
        searchResults.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      searchResults.innerHTML = '<div class="empty-state">Gagal memuat data. Coba lagi.</div>';
    }
  });
}

loadProfile();
