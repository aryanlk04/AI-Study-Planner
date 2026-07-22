import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  subjectId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    // No orderBy — avoids composite index requirement. Sort client-side.
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
              createdAt: d.createdAt?.toDate() || new Date(),
              updatedAt: d.updatedAt?.toDate() || new Date(),
            } as Note;
          })
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setNotes(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addNote = async (note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Must be logged in');
    const now = serverTimestamp();
    const docRef = await addDoc(collection(db, 'notes'), {
      ...note,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    await updateDoc(doc(db, 'notes', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteNote = async (id: string) => {
    await deleteDoc(doc(db, 'notes', id));
  };

  return { notes, loading, error, addNote, updateNote, deleteNote };
}
