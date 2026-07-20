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

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  examDate?: Date | null;
  progress?: number; // 0-100
  createdAt: Date;
}

export function useSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'subjects'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          examDate: d.examDate?.toDate() || null,
          createdAt: d.createdAt?.toDate() || new Date(),
        } as Subject;
      });
      setSubjects(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addSubject = async (subject: Omit<Subject, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Must be logged in');
    return await addDoc(collection(db, 'subjects'), {
      ...subject,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    await updateDoc(doc(db, 'subjects', id), updates);
  };

  const deleteSubject = async (id: string) => {
    await deleteDoc(doc(db, 'subjects', id));
  };

  return { subjects, loading, addSubject, updateSubject, deleteSubject };
}
