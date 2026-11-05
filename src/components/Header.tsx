import React from 'react';
import { motion } from 'motion/react';
import { Clock, Plus, ShieldAlert, MessageSquare, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTime: Date;
  onRunPenaltyCheck: () => void;
  onOpenAddBrand: () => void;
  onOpenNewTicket: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTime,
  onRunPenaltyCheck,
  onOpenAddBrand,
  onOpenNewTicket,
}) => {
  return (
    <header className="border-b border-pink-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hub Info */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-pink-300 flex items-center justify-center font-black text-lg shadow-md shadow-pink-300/50 text-white select-none"
            >
              A•T
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight text-slate-900">Alt.Tribe</h1>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                  Retail Ops Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">Concept Space & Brand Concession Hub</p>
            </div>
          </div>

          {/* Live Status Indicators */}
          <div className="hidden md:flex items-center gap-5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                System Sync: <span className="text-slate-800 font-mono font-bold">Real-Time</span>
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-slate-700 bg-pink-50/70 px-2.5 py-1 rounded-lg border border-pink-200/80 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-pink-600" />
              <span>{currentTime.toLocaleTimeString('en-IN', { hour12: true })}</span>
            </div>
            <div className="bg-pink-50/70 border border-pink-200/80 px-3 py-1 rounded-lg text-slate-700 shadow-2xs">
              Deadline: <span className="font-bold text-pink-700">24th Monthly</span>
            </div>
          </div>

          {/* Header Fast Actions */}
          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRunPenaltyCheck}
              aria-label="Run 24th Penalty Check"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors shadow-2xs cursor-pointer"
              title="Evaluate contracts against the 24th deadline rule"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Run 24th Penalty Check</span>
              <span className="sm:hidden">Penalty Audit</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAddBrand}
              aria-label="Add Brand"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white transition-all shadow-md shadow-pink-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Brand</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenNewTicket}
              aria-label="New Ticket"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-pink-50 border border-pink-200 text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-pink-600" />
              <span className="hidden sm:inline">New Ticket</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};
