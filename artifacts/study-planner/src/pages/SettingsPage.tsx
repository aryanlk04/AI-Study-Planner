import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubjects } from '@/hooks/use-subjects';
import { Plus, Trash2, Edit2, Save, User, Bell, Shield, Moon } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateProfile } from 'firebase/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects();
  
  const [activeTab, setActiveTab] = useState('account');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  // Subject Management
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#C8A97E');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName });
      // Update in firestore users collection too
      await updateDoc(doc(db, 'users', user.uid), { name: displayName });
      alert("Profile updated successfully");
    } catch (e) {
      console.error(e);
      alert("Failed to update profile");
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    await addSubject({ name: newSubjectName, color: newSubjectColor });
    setNewSubjectName('');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-3xl font-display font-semibold text-foreground mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'subjects', label: 'Subjects & Curriculum', icon: Edit2 },
            { id: 'preferences', label: 'Preferences', icon: Bell },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'account' && (
            <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
              <h2 className="font-display text-xl font-semibold mb-6">Account Details</h2>
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Email cannot be changed directly.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleUpdateProfile}
                  className="bg-foreground text-background px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
              <h2 className="font-display text-xl font-semibold mb-2">Manage Subjects</h2>
              <p className="text-muted-foreground mb-8 text-sm">Organize your tasks, notes, and flashcards by subject.</p>
              
              <form onSubmit={handleAddSubject} className="flex gap-3 mb-8">
                <input 
                  type="text" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="New subject name..."
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
                <input 
                  type="color" 
                  value={newSubjectColor}
                  onChange={(e) => setNewSubjectColor(e.target.value)}
                  className="w-12 h-11 p-1 bg-background border border-border rounded-xl cursor-pointer shadow-sm"
                />
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-primary/90 flex items-center gap-2"
                >
                  <Plus size={18} /> Add
                </button>
              </form>

              <div className="space-y-3">
                {subjects.map(subject => (
                  <div key={subject.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }}></div>
                      <span className="font-medium">{subject.name}</span>
                    </div>
                    <button 
                      onClick={() => {
                        if(confirm('Delete subject? This will not delete associated notes/tasks.')) {
                          deleteSubject(subject.id);
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {subjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                    No subjects added yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
              <h2 className="font-display text-xl font-semibold mb-6">App Preferences</h2>
              <div className="space-y-6">
                
                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <h3 className="font-medium text-foreground">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground mt-1">Receive daily study reminders.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-border">
                  <div>
                    <h3 className="font-medium text-foreground">Dark Mode</h3>
                    <p className="text-sm text-muted-foreground mt-1">App requested to stay in warm light mode.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                    <input type="checkbox" className="sr-only peer" disabled />
                    <div className="w-11 h-6 bg-secondary rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                  </label>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}