import { openDB } from 'idb';

const dbPromise = openDB('dnsExceptionsDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('exceptions')) {
      db.createObjectStore('exceptions', { keyPath: 'id', autoIncrement: true });
    }
  },
});

// Legge tutte le eccezioni memorizzate
const readExceptions = async () => {
  const db = await dbPromise;
  const exceptions = await db.getAll('exceptions');
  return exceptions.map((exception) => exception.value); // Estrai i valori
};

// Salva le eccezioni persistendole in IndexedDB
const saveExceptions = async (exceptions) => {
  try {
    const db = await dbPromise;
    await db.clear('exceptions'); // Cancella eccezioni precedenti
    await Promise.all(
      exceptions.map((exception) => db.add('exceptions', { value: exception }))
    );
    return true; // Operazione riuscita
  } catch (err) {
    console.error('Errore durante il salvataggio delle eccezioni:', err);
    return false; // Operazione fallita
  }
};

export { readExceptions, saveExceptions };
