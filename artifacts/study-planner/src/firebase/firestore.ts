import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// Generic helper to get a collection reference
export const getCollection = (path: string) => collection(db, path);

// Fetch all documents for a specific user in a collection
export async function getUserDocs(collectionName: string, userId: string) {
  const q = query(collection(db, collectionName), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Add a document with userId
export async function addUserDoc(collectionName: string, userId: string, data: any) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data, userId };
}

// Update a document
export async function updateDocument(collectionName: string, docId: string, data: any) {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

// Delete a document
export async function deleteDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}
