import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';
import { Brand, Ticket, TicketCategory, TicketUrgency } from '../types/index';

interface NewTicketModalProps {
  isOpen: boolean;
  brands: Brand[];
  existingTicketsCount: number;
  onClose: () => void;
  onCreateTicket: (ticket: Ticket) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  brands,
  existingTicketsCount,
  onClose,
  onCreateTicket,
}) => {
  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [category, setCategory] = useState<TicketCategory>('Display Maintenance');
  const [urgency, setUrgency] = useState<TicketUrgency>('Medium');
  const [assignee, setAssignee] = useState('Floor Lead (Vikram)');
  const [subject, setSubject] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenBrand = brands.find((b) => b.id === brandId) || brands[0];
    const newTk: Ticket = {
      id: `ALT-TK-${100 + existingTicketsCount + 1}`,
      brandId: chosenBrand.id,
      brandName: chosenBrand.name,
      category,
      urgency,
      subject: subject.trim(),
      assignee,
      status: 'Open',
      createdDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      actionables: [
        { id: 1, text: 'Initial physical check on designated shelf bay', done: false },
        { id: 2, text: 'Resolve and log root cause', done: false },
      ],
      notes: [
        {
          id: 1,
          author: assignee,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          text: `Ticket logged: ${subject.trim()}`,
        },
      ],
    };

    onCreateTicket(newTk);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="bg-white border border-pink-200 rounded-3xl max-w-md w-full shadow-2xl shadow-pink-200/50 p-6"
        >
          <div className="flex justify-between items-center pb-3 border-b border-pink-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 id="ticket-modal-title" className="font-extrabold text-slate-900 text-sm">
                Raise Floor Support Ticket
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-pink-100/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
            <div>
              <label htmlFor="ticket-brand" className="text-slate-700 font-bold block mb-1">
                Concerned Brand *
              </label>
              <select
                id="ticket-brand"
                required
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slotId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ticket-category" className="text-slate-700 font-bold block mb-1">
                Issue Category *
              </label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="Display Maintenance">Display Maintenance</option>
                <option value="Rent/Billing">Rent/Billing Dispute</option>
                <option value="Restock Discrepancy">Restock Discrepancy</option>
                <option value="Damage/Loss">Damage / Floor Shrinkage</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ticket-urgency" className="text-slate-700 font-bold block mb-1">
                  Urgency *
                </label>
                <select
                  id="ticket-urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label htmlFor="ticket-assignee" className="text-slate-700 font-bold block mb-1">
                  Assigned Staff *
                </label>
                <select
                  id="ticket-assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="Floor Lead (Vikram)">Floor Lead (Vikram)</option>
                  <option value="Ops Specialist (Rohan)">Ops Specialist (Rohan)</option>
                  <option value="Accounts (Pooja)">Accounts (Pooja)</option>
                  <option value="Inventory Manager (Kavita)">Inventory Manager (Kavita)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="ticket-subject" className="text-slate-700 font-bold block mb-1">
                Subject / Root Issue *
              </label>
              <textarea
                id="ticket-subject"
                required
                rows={3}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Describe the operational discrepancy or floor event..."
                className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500"
              ></textarea>
            </div>

            <div className="pt-3 border-t border-pink-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white border border-pink-200 text-slate-700 font-semibold rounded-xl hover:bg-pink-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold rounded-xl shadow-md shadow-pink-200 transition-all cursor-pointer"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
