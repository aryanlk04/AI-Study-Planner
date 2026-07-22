import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTasks, Task } from '@/hooks/use-tasks';
import { useSubjects } from '@/hooks/use-subjects';
import { format } from 'date-fns';

type ColumnType = 'todo' | 'in_progress' | 'done';

export default function TasksPage() {
  const { tasks, loading, addTask, updateTaskStatus, deleteTask } = useTasks();
  const { subjects } = useSubjects();
  
  const [isAddingTask, setIsAddingTask] = useState<ColumnType | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');

  const columns: { id: ColumnType; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  const handleAddTask = async (columnId: ColumnType) => {
    if (!newTaskTitle.trim()) return;
    
    await addTask({
      title: newTaskTitle,
      status: columnId,
      priority: 'medium',
      ...(newTaskSubject ? { subjectId: newTaskSubject } : {}),
    });
    
    setNewTaskTitle('');
    setNewTaskSubject('');
    setIsAddingTask(null);
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const subject = subjects.find(s => s.id === task.subjectId);
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card p-4 rounded-xl border border-border shadow-sm group hover:shadow-md transition-all relative overflow-hidden"
      >
        {/* Priority indicator bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          task.priority === 'high' ? 'bg-destructive' : 
          task.priority === 'medium' ? 'bg-warning' : 'bg-success'
        }`} />
        
        <div className="flex justify-between items-start mb-2 pl-1">
          <h4 className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </h4>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status !== 'todo' && (
              <button onClick={() => updateTaskStatus(task.id, 'todo')} className="p-1 hover:bg-secondary rounded text-muted-foreground" title="Move to To Do">
                <AlertCircle size={14} />
              </button>
            )}
            {task.status !== 'in_progress' && (
              <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="p-1 hover:bg-secondary rounded text-muted-foreground" title="Move to In Progress">
                <Clock size={14} />
              </button>
            )}
            {task.status !== 'done' && (
              <button onClick={() => updateTaskStatus(task.id, 'done')} className="p-1 hover:bg-secondary rounded text-success" title="Mark Done">
                <CheckCircle2 size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-3 pl-1">
          {subject && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary text-foreground">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }}></span>
              {subject.name}
            </span>
          )}
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon size={12} />
              {format(task.dueDate, 'MMM d')}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col pb-4">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-display font-semibold text-foreground">Tasks</h1>
        <p className="text-muted-foreground mt-1">Organize your study items with a kanban board.</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
        <div className="flex h-full gap-6 min-w-[900px]">
          {columns.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            
            return (
              <div key={column.id} className="flex flex-col w-[320px] bg-secondary/30 rounded-2xl border border-border/50 p-4">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-display font-medium flex items-center gap-2">
                    {column.title}
                    <span className="bg-secondary text-muted-foreground text-xs px-2 py-0.5 rounded-full font-sans">
                      {columnTasks.length}
                    </span>
                  </h3>
                  <button 
                    onClick={() => setIsAddingTask(column.id)}
                    className="p-1 hover:bg-secondary rounded-lg text-muted-foreground transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  
                  {isAddingTask === column.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card p-3 rounded-xl border border-primary shadow-sm"
                    >
                      <input 
                        autoFocus
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="w-full bg-transparent border-none focus:outline-none text-sm font-medium mb-3"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask(column.id);
                          if (e.key === 'Escape') setIsAddingTask(null);
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <select 
                          value={newTaskSubject}
                          onChange={(e) => setNewTaskSubject(e.target.value)}
                          className="bg-secondary border border-border text-xs rounded-md px-2 py-1 focus:outline-none focus:border-primary w-full"
                        >
                          <option value="">No subject</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button 
                          onClick={() => setIsAddingTask(null)}
                          className="text-xs px-2 py-1 text-muted-foreground hover:bg-secondary rounded"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleAddTask(column.id)}
                          className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded shadow-sm hover:bg-primary/90 font-medium"
                        >
                          Add
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {columnTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </AnimatePresence>
                  
                  {columnTasks.length === 0 && !isAddingTask && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                      <p className="text-sm text-muted-foreground">No tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}