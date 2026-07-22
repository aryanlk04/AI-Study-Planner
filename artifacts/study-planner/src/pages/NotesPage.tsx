import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Bot, FileText, Trash2, Edit3, X, Sparkles, Loader2 } from 'lucide-react';
import { PageError } from '@/components/ErrorMessage';
import { useNotes, Note } from '@/hooks/use-notes';
import { useSubjects } from '@/hooks/use-subjects';
import { format } from 'date-fns';
import { useAiSummarize } from '@workspace/api-client-react';

export default function NotesPage() {
  const { notes, loading, error, addNote, updateNote, deleteNote } = useNotes();
  const { subjects } = useSubjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');
  
  // Editor State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubject, setEditSubject] = useState<string>('');

  const summarizeMutation = useAiSummarize();

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || note.subjectId === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleCreate = async () => {
    try {
      await addNote({
        title: editTitle || 'Untitled Note',
        content: editContent,
        subjectId: editSubject,
        tags: [],
      });
      closeEditor();
    } catch (error) {
      console.error("Failed to create note", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingNote) return;
    try {
      await updateNote(editingNote.id, {
        title: editTitle,
        content: editContent,
        subjectId: editSubject,
      });
      closeEditor();
    } catch (error) {
      console.error("Failed to update note", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
      if (editingNote?.id === id) closeEditor();
    }
  };

  const handleSummarize = async () => {
    if (!editContent.trim() || !editingNote) return;
    
    summarizeMutation.mutate({
      data: { content: editContent, length: 'short' }
    }, {
      onSuccess: (res) => {
        updateNote(editingNote.id, { summary: res.text });
        setEditingNote({ ...editingNote, summary: res.text });
      }
    });
  };

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditSubject(note.subjectId || '');
      setIsCreating(false);
    } else {
      setEditingNote(null);
      setEditTitle('');
      setEditContent('');
      setEditSubject('');
      setIsCreating(true);
    }
  };

  const closeEditor = () => {
    setEditingNote(null);
    setIsCreating(false);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }
  if (error) {
    return <PageError error={error} title="Failed to load notes" />;
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] gap-6 -m-4 md:-m-8 p-4 md:p-8 bg-background">
      
      {/* List Panel */}
      <div className={`flex flex-col w-full md:w-1/3 min-w-[320px] max-w-[400px] h-full ${editingNote || isCreating ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-semibold">Notes</h1>
          <button 
            onClick={() => openEditor()}
            className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-sm hover:bg-primary/90 transition-transform hover:scale-105"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedSubject === 'all' ? 'bg-foreground text-background' : 'bg-card border border-border text-foreground hover:bg-secondary'}`}
            >
              All Subjects
            </button>
            {subjects.map(s => (
              <button 
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border`}
                style={{
                  backgroundColor: selectedSubject === s.id ? s.color : 'transparent',
                  color: selectedSubject === s.id ? '#fff' : 'inherit',
                  borderColor: selectedSubject === s.id ? s.color : 'hsl(var(--border))'
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSubject === s.id ? '#fff' : s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl">
              <FileText className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-muted-foreground text-sm">No notes found. Create your first note!</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotes.map(note => {
                const isSelected = editingNote?.id === note.id;
                const subject = subjects.find(s => s.id === note.subjectId);
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => openEditor(note)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-card border-border hover:border-primary/50 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground truncate pr-4">{note.title}</h3>
                      <button 
                        onClick={(e) => handleDelete(e, note.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {note.content || "Empty note"}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {subject && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                            {subject.name}
                          </span>
                        )}
                      </div>
                      <span>{format(note.updatedAt, 'MMM d, yyyy')}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className={`flex-1 h-full flex flex-col bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden ${!editingNote && !isCreating ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        
        {(!editingNote && !isCreating) ? (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Edit3 size={32} className="text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-medium text-foreground mb-2">Select a note</h2>
            <p className="text-muted-foreground mb-6">Choose a note from the list to view or edit, or create a new one to start writing.</p>
            <button 
              onClick={() => openEditor()}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium inline-flex items-center gap-2 hover:bg-primary/90 transition-transform hover:-translate-y-0.5 shadow-sm"
            >
              <Plus size={18} />
              Create New Note
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border shrink-0">
              <button 
                onClick={closeEditor}
                className="md:hidden p-2 text-muted-foreground hover:bg-secondary rounded-lg"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 ml-auto">
                {editingNote && (
                  <button 
                    onClick={handleSummarize}
                    disabled={summarizeMutation.isPending || !editContent.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {summarizeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Summarize with AI
                  </button>
                )}
                <select
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="bg-secondary border border-border text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button 
                  onClick={isCreating ? handleCreate : handleUpdate}
                  className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-primary/90"
                >
                  {isCreating ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note Title"
                className="text-4xl font-display font-semibold bg-transparent border-none focus:outline-none placeholder-muted-foreground/50 w-full"
              />
              
              {editingNote?.summary && (
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 my-2 relative group">
                  <div className="flex items-center gap-2 text-accent font-medium text-sm mb-2">
                    <Sparkles size={16} />
                    AI Summary
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{editingNote.summary}</p>
                </div>
              )}
              
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Start typing your notes here... Supports plain text. Use structure to make AI summarization better."
                className="flex-1 w-full bg-transparent border-none focus:outline-none resize-none placeholder-muted-foreground/50 text-foreground font-sans leading-relaxed text-lg mt-2"
              />
            </div>
          </>
        )}
      </div>
      
    </div>
  );
}