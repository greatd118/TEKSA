// ============================================
// TEKSA — Galeri Kegiatan
// Data foto masih placeholder. Ganti array PHOTOS dengan data asli
// (isi field src dengan path foto sungguhan) begitu tersedia.
// ============================================

const PHOTOS = [
  { id: 1, category: 'kelas', caption: 'Kegiatan Kelas #1', src: null },
  { id: 2, category: 'praktikum', caption: 'Praktikum Jaringan #1', src: null },
  { id: 3, category: 'sekolah', caption: 'Acara Sekolah #1', src: null },
  { id: 4, category: 'kelas', caption: 'Kegiatan Kelas #2', src: null },
  { id: 5, category: 'praktikum', caption: 'Praktikum Jaringan #2', src: null },
  { id: 6, category: 'sekolah', caption: 'Acara Sekolah #2', src: null },
];

const grid = document.getElementById('galleryGrid');
const filters = document.querySelectorAll('.day-tab, .filter-btn');
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');

function renderGallery(list) {
  grid.innerHTML = '';
  list.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = photo.src
      ? `<img src="${photo.src}" alt="${photo.caption}">`
      : `<div class="gallery-item__placeholder">📷<br>${photo.caption}<br><span style="color: var(--text-dim);">(belum ada foto)</span></div>`;
    const tag = document.createElement('span');
    tag.className = 'gallery-item__tag';
    tag.textContent = photo.category;
    item.appendChild(tag);
    item.addEventListener('click', () => openLightbox(photo));
    grid.appendChild(item);
  });
}

function openLightbox(photo) {
  lightboxContent.innerHTML = photo.src
    ? `<img src="${photo.src}" alt="${photo.caption}" style="max-width: 100%; border-radius: 3px;">`
    : `<div style="padding: 40px; font-family: var(--font-mono); color: var(--text-dim);">📷<br><br>${photo.caption}<br>Belum ada foto diunggah.</div>`;
  lightbox.classList.add('is-open');
}

document.getElementById('lightboxClose').addEventListener('click', () => {
  lightbox.classList.remove('is-open');
});

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.remove('is-open');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox.classList.remove('is-open');
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const cat = btn.dataset.filter;
    renderGallery(cat === 'all' ? PHOTOS : PHOTOS.filter(p => p.category === cat));
  });
});

renderGallery(PHOTOS);
