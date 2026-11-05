import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, MessageSquare, CheckSquare, Clock } from 'lucide-react';
import { Ticket, TicketStatus } from '../types/index';

interface TicketsTabProps {
  tickets: Ticket[];
  onOpenNewTicket: () => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onToggleActionable: (ticketId: string, actionableId: number) => void;
  onAddTicketNote: (ticketId: string, noteText: string) => void;
}

export const TicketsTab: React.FC<TicketsTabProps> = ({
  tickets,
  onOpenNewTicket,
  onUpdateTicketStatus,
  onToggleActionable,
  onAddTicketNote,
}) => {
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const handleNoteKeyDown = (ticketId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = noteInputs[ticketId]?.trim();
      if (text) {
        onAddTicketNote(ticketId, text);
        setNoteInputs((prev) => ({ ...prev, [ticketId]: '' }));
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="bg-white rounded-2xl border border-pink-100 shadow-md shadow-pink-100/40 overflow-hidden">
        <div className="p-4 border-b border-pink-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              Ops Resolution Desk & Brand Support Logs
            </h2>
            <p className="text-xs text-slate-500">
              Track shelf maintenance, audit discrepancies, billing disputes, and floor staff assignments
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenNewTicket}
            aria-label="Raise Support Ticket"
            className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-pink-200"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Raise Support Ticket</span>
          </motion.button>
        </div>

        <div className="divide-y divide-pink-50">
          {tickets.map((t) => {
            const completedActionables = t.actionables.filter((a) => a.done).length;

            return (
              <div key={t.id} className="p-5 hover:bg-pink-50/25 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                      {t.id}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-900 text-sm">{t.brandName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                      {t.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {/* Urgency Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        t.urgency === 'Critical'
                          ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                          : t.urgency === 'High'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : t.urgency === 'Medium'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.urgency}
                    </span>

                    {/* Status Select */}
                    <label htmlFor={`ticket-status-${t.id}`} className="sr-only">
                      Ticket Status for {t.id}
                    </label>
                    <select
                      id={`ticket-status-${t.id}`}
                      value={t.status}
                      onChange={(e) => onUpdateTicketStatus(t.id, e.target.value as TicketStatus)}
                      className={`px-2.5 py-1 rounded-lg text-xs border font-bold bg-white focus:outline-none cursor-pointer shadow-2xs ${
                        t.status === 'Resolved'
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50/50'
                          : t.status === 'In Progress'
                          ? 'border-amber-300 text-amber-800 bg-amber-50/50'
                          : 'border-pink-200 text-slate-700'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-800 mt-2 font-semibold">{t.subject}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2">
                  <span>
                    Assignee: <span className="text-slate-800 font-semibold">{t.assignee}</span>
                  </span>
                  <span>
                    Logged: <span className="text-slate-700 font-mono font-medium">{t.createdDate}</span>
                  </span>
                  <span>
                    Actionables:{' '}
                    <span className="text-pink-700 font-mono font-bold">
                      {completedActionables}/{t.actionables.length} Completed
                    </span>
                  </span>
                </div>

                {/* Interactive Actionables & Notes */}
                <div className="mt-3.5 pt-3.5 border-t border-pink-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Actionables Checklist */}
                  <div className="bg-pink-50/30 p-3.5 rounded-xl border border-pink-100">
                    <span className="font-bold text-pink-900 text-[11px] uppercase tracking-wider block mb-2">
                      Operational Action Items
                    </span>
                    <div className="space-y-2">
                      {t.actionables.map((act) => (
                        <label
                          key={act.id}
                          className="flex items-center gap-2 text-slate-700 hover:text-slate-950 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={act.done}
                            onChange={() => onToggleActionable(t.id, act.id)}
                            className="rounded text-pink-600 focus:ring-pink-400 border-pink-200 cursor-pointer"
                          />
                          <span className={act.done ? 'line-through text-slate-400' : 'font-medium'}>
                            {act.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes & Staff Log */}
                  <div className="bg-pink-50/30 p-3.5 rounded-xl border border-pink-100 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-pink-900 text-[11px] uppercase tracking-wider block mb-1.5">
                        Staff Resolution Log
                      </span>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {t.notes.map((n) => (
                          <div key={n.id} className="text-[11px] border-b border-pink-100/70 pb-1">
                            <span className="font-bold text-pink-700">{n.author}</span>{' '}
                            <span className="text-[10px] text-slate-400 font-mono">({n.time})</span>:
                            <p className="text-slate-700 mt-0.5">{n.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Append Note */}
                    <div className="mt-2.5 pt-2 border-t border-pink-100 flex gap-2">
                      <label htmlFor={`quick-note-${t.id}`} className="sr-only">
                        Add internal note for ticket {t.id}
                      </label>
                      <input
                        id={`quick-note-${t.id}`}
                        type="text"
                        aria-label="Add brief internal note"
                        placeholder="Add brief internal note and press Enter..."
                        value={noteInputs[t.id] || ''}
                        onChange={(e) =>
                          setNoteInputs((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        onKeyDown={(e) => handleNoteKeyDown(t.id, e)}
                        className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-400 transition-colors shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
