// ============================================
// TEKSA — Daftar Anggota
// Data siswa masih placeholder. Ganti array MEMBERS di bawah
// dengan data asli kapan pun sudah tersedia.
// ============================================

const MEMBERS = Array.from({ length: 36 }, (_, i) => ({
  no: i + 1,
  name: `<anggota_${i + 1}>`,
  title: '',
}));

const grid = document.getElementById('memberGrid');
const searchInput = document.getElementById('memberSearch');
const countEl = document.getElementById('memberCount');

function initials(name) {
  const clean = name.replace(/[<>]/g, '');
  const parts = clean.split(/[\s_]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
}

function renderMembers(list) {
  grid.innerHTML = '';
  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-state">Tidak ada anggota yang cocok dengan pencarian.</div>';
    countEl.textContent = '0 anggota ditemukan';
    return;
  }
  list.forEach(m => {
    const card = document.createElement('div');
    card.className = 'panel panel--interactive member-card';
    card.innerHTML = `
      <div class="member-card__avatar">${initials(m.name)}</div>
      <div class="member-card__info">
        <div class="member-card__no">No. ${String(m.no).padStart(2, '0')}</div>
        <div class="member-card__name">${m.title ? `<span class="member-card__title">${m.title}</span> ` : ''}${m.name}</div>
      </div>
    `;
    grid.appendChild(card);
  });
  countEl.textContent = `${list.length} anggota ditemukan`;
}

renderMembers(MEMBERS);

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = MEMBERS.filter(m => m.name.toLowerCase().includes(q));
  renderMembers(filtered);
});
