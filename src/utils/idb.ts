export interface StoredIdentity {
  workspaceId: string;
  deviceId: string;
  token: string;
  deviceName: string;
}

const DB_NAME = 'anantha-push';
const STORE_NAME = 'meta';
const IDENTITY_KEY = 'identity';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB'));
  });
}

export async function savePushIdentity(identity: StoredIdentity | null): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      if (identity) store.put(identity, IDENTITY_KEY);
      else store.delete(IDENTITY_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    // IndexedDB is a progressive enhancement for resubscribe events.
  }
}

export async function loadPushIdentity(): Promise<StoredIdentity | null> {
  try {
    const db = await openDatabase();
    const result = await new Promise<StoredIdentity | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(IDENTITY_KEY);
      request.onsuccess = () => resolve((request.result as StoredIdentity) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}
