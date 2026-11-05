import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Store } from 'lucide-react';
import { Brand } from '../types/index';

interface AddBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBrand: (brand: Brand) => void;
  existingCount: number;
}

export const AddBrandModal: React.FC<AddBrandModalProps> = ({
  isOpen,
  onClose,
  onAddBrand,
  existingCount,
}) => {
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [slotId, setSlotId] = useState('');
  const [rent, setRent] = useState(6500);
  const [stock, setStock] = useState(15);
  const [commission, setCommission] = useState(15);
  const [price, setPrice] = useState(1200);
  const [gstin, setGstin] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBrand: Brand = {
      id: `BRD-0${existingCount + 1}`,
      name: brandName.trim(),
      category: category.trim(),
      slotId: slotId.trim(),
      monthlyRent: Number(rent) || 6500,
      renewalDeadlineDay: 24,
      agreementStartDate: '2026-11-05',
      agreementEndDate: '2026-12-05',
      status: 'Active',
      lateFee: 0,
      shortNoticeDays: 0,
      emergencyRemovalFee: 0,
      unitsSoldWeekly: 0,
      stockOnHand: Number(stock) || 10,
      unitPrice: Number(price) || 1200,
      commissionRate: (Number(commission) || 15) / 100,
      noticeDate: null,
      contactPerson: contactPerson.trim() || 'Store Manager',
      contactEmail: contactEmail.trim() || 'contact@brand.com',
      gstin: gstin.trim() || '29ABCDE0000Z1',
    };

    onAddBrand(newBrand);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-brand-modal-title"
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
                <Store className="w-4 h-4" />
              </div>
              <h3 id="add-brand-modal-title" className="font-extrabold text-slate-900 text-sm">
                Add New Concession Brand
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
              <label htmlFor="brand-name" className="text-slate-700 font-bold block mb-1">
                Brand Name *
              </label>
              <input
                id="brand-name"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Terra Pottery Co."
                className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="brand-category" className="text-slate-700 font-bold block mb-1">
                  Category *
                </label>
                <input
                  id="brand-category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Ceramics"
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label htmlFor="brand-slot" className="text-slate-700 font-bold block mb-1">
                  Floor Bay / Slot ID *
                </label>
                <input
                  id="brand-slot"
                  required
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  placeholder="e.g. Shelf D-02"
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="brand-rent" className="text-slate-700 font-bold block mb-1">
                  Rent (Min ₹6.5k)
                </label>
                <input
                  id="brand-rent"
                  type="number"
                  min={6500}
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value))}
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="brand-stock" className="text-slate-700 font-bold block mb-1">
                  Initial Stock
                </label>
                <input
                  id="brand-stock"
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="brand-commission" className="text-slate-700 font-bold block mb-1">
                  Comm (%)
                </label>
                <input
                  id="brand-commission"
                  type="number"
                  min={1}
                  max={50}
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="brand-price" className="text-slate-700 font-bold block mb-1">
                  Avg Unit Price (₹)
                </label>
                <input
                  id="brand-price"
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                />
              </div>
              <div>
                <label htmlFor="brand-gstin" className="text-slate-700 font-bold block mb-1">
                  GSTIN
                </label>
                <input
                  id="brand-gstin"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="29XXXXX0000X1Z5"
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500 font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="brand-contact-person" className="text-slate-700 font-bold block mb-1">
                  Contact Person
                </label>
                <input
                  id="brand-contact-person"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Founder Name"
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label htmlFor="brand-contact-email" className="text-slate-700 font-bold block mb-1">
                  Contact Email
                </label>
                <input
                  id="brand-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="team@brand.com"
                  className="w-full bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
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
                Onboard Brand
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
