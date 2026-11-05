import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Phone,
  User,
  Store,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Brand } from '../types/index';
import {
  formatBrandWhatsAppMessage,
  getBrandWhatsAppUrl,
  cleanPhoneNumber,
} from '../utils/whatsapp';
import { getContractExpiryInfo, calculateTotalPenalty, formatINR } from '../utils/billing';

interface WhatsAppModalProps {
  brand: Brand | null;
  onClose: () => void;
  referenceDate?: Date;
  onCopied?: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  brand,
  onClose,
  referenceDate = new Date('2026-11-05T00:00:00'),
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);

  if (!brand) return null;

  const phone = cleanPhoneNumber(brand.contactPhone);
  const formattedMessage = formatBrandWhatsAppMessage(brand, referenceDate);
  const waUrl = getBrandWhatsAppUrl(brand, referenceDate);
  const expiryInfo = getContractExpiryInfo(brand, referenceDate);
  const totalPenalty = calculateTotalPenalty(brand);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(formattedMessage);
      }
      setCopied(true);
      if (onCopied) onCopied();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-2xl border border-pink-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 id="whatsapp-modal-title" className="font-bold text-base tracking-tight flex items-center gap-2">
                  <span>Founder WhatsApp Dispatch</span>
                  <span className="text-[10px] bg-emerald-500/80 uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full text-white">
                    Live Status
                  </span>
                </h3>
                <p className="text-emerald-100/90 text-xs mt-0.5">
                  Direct WhatsApp link & pre-filled contract renewal notification
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Founder & Brand Context Card */}
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{brand.name}</span>
                  <span className="bg-pink-100 text-pink-800 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-pink-200">
                    Slot {brand.slotId}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 font-medium">{brand.category}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-xs flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-pink-500" />
                    <span>{brand.contactPerson || 'Brand Founder'}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{brand.contactPhone || '+91 98801 23456'}</span>
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="shrink-0">
                {brand.status === 'Active' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Active Agreement
                  </span>
                )}
                {brand.status === 'Overdue' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Overdue Renewal
                  </span>
                )}
                {brand.status === 'Grace Period' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Grace Cutoff
                  </span>
                )}
                {brand.status === 'Notice Served' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    Notice Served
                  </span>
                )}
                {brand.status === 'Discontinued' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                    Discontinued
                  </span>
                )}
              </div>
            </div>

            {/* Contract Key Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Cycle Expiry
                </span>
                <span className="font-bold text-slate-800 font-mono text-xs mt-0.5 block">
                  {expiryInfo.formattedDate}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    expiryInfo.isExpiringSoon || expiryInfo.isExpired
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {expiryInfo.isExpired
                    ? 'Expired'
                    : `${expiryInfo.daysRemaining}d remaining`}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Monthly Rent
                </span>
                <span className="font-bold text-slate-900 font-mono text-xs mt-0.5 block">
                  {formatINR(brand.monthlyRent)}
                </span>
                <span className="text-[10px] text-slate-400">per 30d cycle</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Penalties
                </span>
                <span
                  className={`font-bold font-mono text-xs mt-0.5 block ${
                    totalPenalty > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {formatINR(totalPenalty)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {totalPenalty > 0 ? 'Action required' : 'Clean ledger'}
                </span>
              </div>
            </div>

            {/* Pre-filled Message Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pre-filled WhatsApp Message Content</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Recipient: +{phone}
                </span>
              </div>

              <div className="relative">
                <pre className="w-full bg-slate-900 text-emerald-300 p-4 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800 max-h-56 select-all shadow-inner">
                  {formattedMessage}
                </pre>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                copied
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 hover:bg-pink-50 border-pink-200'
              }`}
              title="Copy message to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Message Text</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition-all cursor-pointer"
                title={`Open WhatsApp chat with ${brand.contactPerson || brand.name}`}
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Open in WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
