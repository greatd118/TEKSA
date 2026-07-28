// ============================================
// TEKSA — Firebase Configuration
// 2 project terpisah:
//   1. TEKSA Profil  -> data profil siswa (publik, bisa dibaca semua orang)
//   2. TEKSA Pass    -> kredensial (sandi ter-hash, kode unik, device ID)
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- Project 1: TEKSA Profil ---
const profilConfig = {
  apiKey: "AIzaSyDdlSXw8Haai_D-JKp0-uIDwqFo46r8s8o",
  authDomain: "teksa-a0f45.firebaseapp.com",
  projectId: "teksa-a0f45",
  storageBucket: "teksa-a0f45.firebasestorage.app",
  messagingSenderId: "210916287437",
  appId: "1:210916287437:web:4091e4e49dbd661a1ada84",
};

// --- Project 2: TEKSA Pass ---
const passConfig = {
  apiKey: "AIzaSyCE9ifBFvaMG9ukna-Q3SWkwyOX0EzNRNg",
  authDomain: "teksa2.firebaseapp.com",
  projectId: "teksa2",
  storageBucket: "teksa2.firebasestorage.app",
  messagingSenderId: "451040680210",
  appId: "1:451040680210:web:7dab909c13ddf4b0303bcb",
};

const profilApp = initializeApp(profilConfig, "profil");
const passApp = initializeApp(passConfig, "pass");

export const dbProfil = getFirestore(profilApp);
export const dbPass = getFirestore(passApp);
