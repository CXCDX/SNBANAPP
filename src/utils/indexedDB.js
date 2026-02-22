const DB_NAME = 'BannerStudioDB'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('badges')) {
        db.createObjectStore('badges', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('fonts')) {
        db.createObjectStore('fonts', { keyPath: 'name' })
      }
      if (!db.objectStoreNames.contains('logos')) {
        db.createObjectStore('logos', { keyPath: 'id' })
      }
    }
  })
}

function tx(storeName, mode = 'readonly') {
  return openDB().then(db => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    return { store, transaction, db }
  })
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Badges
export async function saveBadge(badge) {
  const { store } = await tx('badges', 'readwrite')
  return promisify(store.put(badge))
}

export async function getAllBadges() {
  const { store } = await tx('badges')
  return promisify(store.getAll())
}

export async function deleteBadge(id) {
  const { store } = await tx('badges', 'readwrite')
  return promisify(store.delete(id))
}

// Fonts
export async function saveFont(font) {
  const { store } = await tx('fonts', 'readwrite')
  return promisify(store.put(font))
}

export async function getAllFonts() {
  const { store } = await tx('fonts')
  return promisify(store.getAll())
}

export async function deleteFont(name) {
  const { store } = await tx('fonts', 'readwrite')
  return promisify(store.delete(name))
}

// Custom logos
export async function saveCustomLogo(logo) {
  const { store } = await tx('logos', 'readwrite')
  return promisify(store.put(logo))
}

export async function getCustomLogo() {
  const { store } = await tx('logos')
  const all = await promisify(store.getAll())
  return all[0] || null
}

export async function deleteCustomLogo(id) {
  const { store } = await tx('logos', 'readwrite')
  return promisify(store.delete(id))
}
