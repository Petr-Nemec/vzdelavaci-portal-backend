const admin = require('firebase-admin');

// Inicializace Firebase Admin s proměnnými prostředí
const initializeFirebaseAdmin = () => {
  try {
    // Kontrola, zda jsou nastaveny požadované proměnné prostředí
    if (!process.env.FIREBASE_PROJECT_ID || 
        !process.env.FIREBASE_PRIVATE_KEY || 
        !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Chybí Firebase konfigurační proměnné prostředí');
      return null;
    }

    // Načtení Firebase konfigurace z proměnných prostředí
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    // Inicializace Firebase Admin
    const app = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });

    console.log('Firebase Admin SDK úspěšně inicializován');
    return app;
  } catch (error) {
    console.error('Chyba při inicializaci Firebase Admin SDK:', error);
    return null;
  }
};

module.exports = initializeFirebaseAdmin;
