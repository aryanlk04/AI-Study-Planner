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

export interface Flashcard {
  id: string;
  userId: string;
  deckId: string;
  subjectId?: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'unrated';
  nextReviewDate: Date;
  createdAt: Date;
}

export function useFlashcards() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFlashcards([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'flashcards'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          nextReviewDate: d.nextReviewDate?.toDate() || new Date(),
          createdAt: d.createdAt?.toDate() || new Date(),
        } as Flashcard;
      });
      setFlashcards(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addFlashcard = async (card: Omit<Flashcard, 'id' | 'userId' | 'createdAt' | 'difficulty' | 'nextReviewDate'>) => {
    if (!user) throw new Error('Must be logged in');
    
    await addDoc(collection(db, 'flashcards'), {
      ...card,
      userId: user.uid,
      difficulty: 'unrated',
      nextReviewDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  };

  const updateReview = async (id: string, difficulty: 'easy' | 'medium' | 'hard') => {
    // Basic spaced repetition logic
    let daysToAdd = 1;
    if (difficulty === 'easy') daysToAdd = 4;
    else if (difficulty === 'medium') daysToAdd = 2;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    await updateDoc(doc(db, 'flashcards', id), {
      difficulty,
      nextReviewDate: nextReview,
    });
  };

  const deleteFlashcard = async (id: string) => {
    await deleteDoc(doc(db, 'flashcards', id));
  };

  return { flashcards, loading, addFlashcard, updateReview, deleteFlashcard };
}
