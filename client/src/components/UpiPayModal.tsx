import React, { useState } from 'react';
import { IndianRupee, X, ShieldCheck, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { Contact } from '../types';
import { processUpiPayment } from '../services/api';
import { sounds } from '../services/soundEffects';

interface UpiPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onPaymentSuccess?: () => void;
}

export const UpiPayModal: React.FC<UpiPayModalProps> = ({
  isOpen,
  onClose,
  contact,
  onPaymentSuccess
}) => {
  const [amount, setAmount] = useState<number>(500);
  const [note, setNote] = useState<string>('Project / Supplies');
  const [step, setStep] = useState<'amount' | 'pin' | 'success'>('amount');
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>('');

  if (!isOpen || !contact) return null;

  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  const handleProceedToPin = () => {
    if (!amount || amount <= 0) return;
    setStep('pin');
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) return;
    setLoading(true);

    try {
      const res = await processUpiPayment({
        contactId: contact.id,
        amount: Number(amount),
        note: note,
        receiverVpa: contact.phone?.replace(/\s+/g, '') + '@nexuspay'
      });

      setUtrNumber(res.payment.utr);
      sounds.playUpiSuccess();
      setLoading(false);
      setStep('success');

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('amount');
    setPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0e1622] border border-emerald-500/40 rounded-3xl w-full max-w-[390px] max-h-[92dvh] overflow-y-auto no-scrollbar shadow-2xl emerald-glow flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#121c2b] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                <span>Nexus UPI RuPay PayChat</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                  NPCI 2.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Zero-Fee Sovereign Real-Time Settlement</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: AMOUNT SELECTION */}
        {step === 'amount' && (
          <div className="p-6 space-y-5">
            {/* Beneficiary Pill */}
            <div className="flex items-center space-x-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-11 h-11 rounded-full object-cover border border-emerald-500/40"
              />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">Paying to</p>
                <h4 className="font-bold text-sm text-white truncate">{contact.name}</h4>
                <p className="text-[11px] text-emerald-400 font-mono truncate">
                  {contact.phone ? contact.phone.replace(/\s+/g, '') + '@nexuspay' : 'recipient@okhdfcbank'}
                </p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="text-center py-2">
              <label className="text-xs text-slate-400 font-medium block mb-2">
                Enter Amount (INR)
              </label>
              <div className="inline-flex items-center justify-center space-x-1">
                <span className="text-3xl font-extrabold text-emerald-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-36 text-center text-4xl font-extrabold text-white bg-transparent border-b-2 border-emerald-500 focus:outline-none"
                  min="1"
                />
              </div>
            </div>

            {/* Quick Chips */}
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    amount === val
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Add a Note / Purpose
              </label>
              <input
                type="text"
                placeholder="What is this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#141d2a] text-sm text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleProceedToPin}
              disabled={amount <= 0}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-700/40 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <span>Proceed to Pay ₹{amount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: PIN ENTRY SIMULATION */}
        {step === 'pin' && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-base text-white">Enter 4-Digit UPI PIN</h4>
              <p className="text-xs text-slate-400 mt-1">
                Secured by NPCI Sovereign Payment Protocol
              </p>
            </div>

            {/* 4 dots */}
            <div className="flex justify-center space-x-4 my-4">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > i
                      ? 'bg-emerald-400 border-emerald-400 scale-110'
                      : 'border-slate-600 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Simulated Numeric Pad */}
            <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((key, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (key === 'C') {
                      setPin('');
                    } else if (key === '✓') {
                      if (pin.length === 4) handlePinSubmit();
                    } else if (pin.length < 4) {
                      const newPin = pin + key;
                      setPin(newPin);
                      if (newPin.length === 4) {
                        setTimeout(() => handlePinSubmit(), 200);
                      }
                    }
                  }}
                  disabled={loading}
                  className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-emerald-600 active:text-white text-base font-bold text-slate-200 transition-colors flex items-center justify-center"
                >
                  {key}
                </button>
              ))}
            </div>

            {loading && (
              <p className="text-xs text-emerald-400 animate-pulse font-medium">
                Contacting Sovereign Banking Gateway via Indian NPCI...
              </p>
            )}
          </div>
        )}

        {/* STEP 3: PAYMENT SUCCESS */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-400 shadow-xl">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Payment Successful
              </span>
              <h3 className="text-3xl font-extrabold text-white mt-2">₹{amount}</h3>
              <p className="text-xs text-slate-300 mt-1">Paid to {contact.name}</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-left text-xs font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">UTR Reference:</span>
                <span className="text-emerald-400">{utrNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span>UPI / RuPay Instant</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold">COMPLETED</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Done & Return to Chat
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#0b111a] border-t border-slate-800/80 flex items-center justify-center space-x-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Government of India & RBI Approved Sovereign Payment Rail</span>
        </div>
      </div>
    </div>
  );
};
