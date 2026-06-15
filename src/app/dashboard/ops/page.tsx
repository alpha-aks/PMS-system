'use client';

import { useState, useEffect } from 'react';
import { getUserDashboardStats } from '@/app/actions/user';
import { motion } from 'framer-motion';
import {
  Kanban, Plus, AlertCircle, CheckCircle2,
  Clock, Zap, MoveRight, Flag
} from 'lucide-react';
import DailyPercentageMeter from '@/components/DailyPercentageMeter';
import StandupModal from '@/components/StandupModal';


const INITIAL_TASKS = {
  'To Do': [
    { id: '1', title: 'Follow up with 3 cold email replies', priority: 'HIGH', time: '30m' },
    { id: '2', title: 'Update agency Google My Business profile', priority: 'MEDIUM', time: '20m' },
    { id: '3', title: 'Compile weekly team hours report', priority: 'HIGH', time: '45m' },
  ],
  'In Progress': [
    { id: '4', title: 'Coordinate TechVision onboarding call', priority: 'URGENT', time: '1h' },
    { id: '5', title: 'Prepare project status deck for internal review', priority: 'MEDIUM', time: '2h' },
  ],
  'Done': [
    { id: '6', title: 'Send invoice reminders to 2 clients', priority: 'HIGH', time: '15m' },
    { id: '7', title: 'Book meeting room for Friday scrums', priority: 'LOW', time: '10m' },
  ],
};

const priorityConfig = {
  URGENT: { color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)', label: 'Urgent' },
  HIGH: { color: 'hsl(38 100% 56%)', bg: 'hsl(38 100% 56% / 0.1)', label: 'High' },
  MEDIUM: { color: 'hsl(234 89% 74%)', bg: 'hsl(234 89% 74% / 0.1)', label: 'Medium' },
  LOW: { color: 'hsl(220 15% 45%)', bg: 'hsl(220 15% 45% / 0.1)', label: 'Low' },
};

const colConfig = {
  'To Do': { color: 'hsl(220 15% 45%)', icon: <Clock size={13} /> },
  'In Progress': { color: 'hsl(234 89% 74%)', icon: <Zap size={13} /> },
  'Done': { color: 'hsl(142 71% 45%)', icon: <CheckCircle2 size={13} /> },
};

const container: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function OpsDashboard() {
  const [showStandup, setShowStandup] = useState(false);
  const [todayPct, setTodayPct] = useState(0);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserDashboardStats().then((stats: any) => {
      if (stats) {
        setMonthlySalary(stats.monthlySalary);
        setTodayPct(stats.todayPct);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading dashboard...</div>;
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [showAddForm, setShowAddForm] = useState(false);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      title: newTaskText,
      priority: newPriority,
      time: '30m',
    };
    setTasks(prev => ({ ...prev, 'To Do': [newTask, ...prev['To Do']] }));
    setNewTaskText('');
    setShowAddForm(false);
  };

  const moveTask = (taskId: string, fromCol: string, toCol: string) => {
    const task = tasks[fromCol as keyof typeof tasks].find(t => t.id === taskId);
    if (!task) return;
    setTasks(prev => ({
      ...prev,
      [fromCol]: prev[fromCol as keyof typeof tasks].filter(t => t.id !== taskId),
      [toCol]: [task, ...prev[toCol as keyof typeof tasks]],
    }));
  };

  const totalTasks = Object.values(tasks).flat().length;
  const doneTasks = tasks['Done'].length;

  return (
    <>
      <StandupModal
        isOpen={showStandup}
        onClose={() => setShowStandup(false)}
        onComplete={(r) => setTodayPct(r.analysis.targetPercentage / 100)}
        userRole="OPS"
        monthlySalary={monthlySalary}
        userName="Rishabh"
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px]">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text-primary">General Operations</h1>
            <p className="text-sm text-text-muted mt-0.5">Ad-hoc task execution · Fast ops board</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-ghost flex items-center gap-2"
            >
              <Plus size={15} />
              Quick Add
            </button>
            <button onClick={() => setShowStandup(true)} className="btn-primary flex items-center gap-2">
              <Kanban size={15} />
              Daily Stand-up
            </button>
          </div>
        </motion.div>

        {/* Quick add form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4"
            style={{ borderColor: 'hsl(162 100% 50% / 0.2)' }}
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Quick-add a task... (press Enter)"
                className="input-field flex-1"
                autoFocus
              />
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="input-field w-36"
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">⚫ Low</option>
              </select>
              <button onClick={addTask} className="btn-primary px-4">Add</button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* Kanban board */}
          <motion.div variants={item} className="col-span-9">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(tasks).map(([col, colTasks]) => {
                const config = colConfig[col as keyof typeof colConfig];
                const nextCol = col === 'To Do' ? 'In Progress' : col === 'In Progress' ? 'Done' : null;

                return (
                  <div key={col} className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{ color: config.color }}>{config.icon}</div>
                      <span className="text-sm font-semibold text-text-secondary">{col}</span>
                      <span
                        className="ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: `${config.color}20`, color: config.color }}
                      >
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2 min-h-[300px]">
                      {colTasks.map(task => {
                        const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
                        return (
                          <motion.div
                            key={task.id}
                            layout
                            className="p-3 rounded-xl cursor-pointer group"
                            style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 20% 16%)' }}
                          >
                            <p className="text-xs font-medium text-text-primary mb-2 leading-snug">{task.title}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Flag size={10} style={{ color: priority.color }} />
                                <span className="text-[10px] font-semibold" style={{ color: priority.color }}>
                                  {priority.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted flex items-center gap-1">
                                  <Clock size={9} /> {task.time}
                                </span>
                                {nextCol && (
                                  <button
                                    onClick={() => moveTask(task.id, col, nextCol)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                    style={{ background: `${config.color}15`, color: config.color }}
                                  >
                                    <MoveRight size={9} />
                                    Move
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right: Performance + quick stats */}
          <motion.div variants={item} className="col-span-3 space-y-4">
            <div className="glass-card p-4 flex flex-col items-center">
              <p className="section-header mb-3 self-start">Today's Performance</p>
              <DailyPercentageMeter percentage={todayPct} projectedPayout={(monthlySalary / 30) * todayPct} monthlySalary={monthlySalary} size="md" />
            </div>

            <div className="glass-card p-4 space-y-3">
              <p className="section-header">Quick Stats</p>
              {[
                { label: 'Tasks Completed', value: `${doneTasks}/${totalTasks}`, color: 'hsl(142 71% 45%)' },
                { label: 'Urgent Items', value: tasks['To Do'].filter(t => t.priority === 'URGENT').length.toString(), color: 'hsl(0 84% 60%)' },
                { label: 'High Priority', value: Object.values(tasks).flat().filter(t => t.priority === 'HIGH').length.toString(), color: 'hsl(38 100% 56%)' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'hsl(220 20% 14%)' }}>
                  <span className="text-xs text-text-secondary">{stat.label}</span>
                  <span className="text-sm font-bold font-display" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {Object.values(tasks).flat().filter(t => t.priority === 'URGENT').length > 0 && (
              <div
                className="p-3 rounded-xl"
                style={{ background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.25)' }}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} style={{ color: 'hsl(0 84% 60%)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'hsl(0 84% 60%)' }}>
                    {Object.values(tasks).flat().filter(t => t.priority === 'URGENT').length} urgent task(s) need attention
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
