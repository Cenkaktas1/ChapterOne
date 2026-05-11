import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

const LibraryContext = createContext();

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};

export const LibraryProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [library, setLibrary] = useState({ movie: [], series: [], book: [] });
  const [loading, setLoading] = useState(true);

  // Firestore'dan kütüphaneyi dinle (real-time)
  useEffect(() => {
    if (!currentUser) {
      setLibrary({ movie: [], series: [], book: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const libraryRef = collection(db, 'users', currentUser.uid, 'library');
    const q = query(libraryRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = { movie: [], series: [], book: [] };
      snapshot.docs.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        if (items[data.category]) {
          items[data.category].push(data);
        }
      });
      // Her kategoride order'a göre sırala
      Object.keys(items).forEach(cat => {
        items[cat].sort((a, b) => a.order - b.order);
      });
      setLibrary(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Kütüphaneye ekle
  const addToLibrary = useCallback(async (item) => {
    if (!currentUser) return false;

    const { category, itemId, title, image, subtitle } = item;
    const docId = `${category}_${itemId}`;
    
    // Mevcut kategorideki en yüksek sıra numarasını bul
    const currentItems = library[category] || [];
    const maxOrder = currentItems.length > 0 
      ? Math.max(...currentItems.map(i => i.order || 0)) 
      : 0;

    const docRef = doc(db, 'users', currentUser.uid, 'library', docId);
    await setDoc(docRef, {
      category,
      itemId: String(itemId),
      title,
      image: image || '',
      subtitle: subtitle || '',
      order: maxOrder + 1,
      addedAt: new Date().toISOString()
    });

    return true;
  }, [currentUser, library]);

  // Kütüphaneden çıkar
  const removeFromLibrary = useCallback(async (category, itemId) => {
    if (!currentUser) return;

    const docId = `${category}_${itemId}`;
    const docRef = doc(db, 'users', currentUser.uid, 'library', docId);
    await deleteDoc(docRef);

    // Kalan öğeleri yeniden sırala
    const remaining = library[category].filter(i => i.itemId !== String(itemId));
    if (remaining.length > 0) {
      const batch = writeBatch(db);
      remaining.forEach((item, index) => {
        const ref = doc(db, 'users', currentUser.uid, 'library', item.id);
        batch.update(ref, { order: index + 1 });
      });
      await batch.commit();
    }
  }, [currentUser, library]);

  // Kütüphanede mi kontrol et
  const isInLibrary = useCallback((category, itemId) => {
    return library[category]?.some(i => i.itemId === String(itemId)) || false;
  }, [library]);

  // Sıralama güncelle (yukarı/aşağı taşı)
  const reorderLibrary = useCallback(async (category, fromIndex, toIndex) => {
    if (!currentUser) return;
    
    const items = [...library[category]];
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) return;

    // Elemanı taşı
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);

    // Firestore'da sırayı güncelle
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const ref = doc(db, 'users', currentUser.uid, 'library', item.id);
      batch.update(ref, { order: index + 1 });
    });
    await batch.commit();
  }, [currentUser, library]);

  const value = {
    library,
    loading,
    addToLibrary,
    removeFromLibrary,
    isInLibrary,
    reorderLibrary
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};
