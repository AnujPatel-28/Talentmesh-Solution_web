"use client";

import React from 'react';
import { WifiOff, AlertTriangle, ShieldAlert, KeyRound } from 'lucide-react';

interface SessionExpireModalProps {
  isOpen: boolean;
  countdown: number;
  onExtend: () => void;
  isOffline: boolean;
  onReconnect: () => void;
}

export function SessionExpireModal({
  isOpen,
  countdown,
  onExtend,
  isOffline,
  onReconnect,
}: SessionExpireModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decorative background glow */}
        <div className="absolute -top-10 -left-10 h-36 w-36 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

        {isOffline ? (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 text-rose-500 animate-pulse mb-4">
              <WifiOff className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight mb-2">
              Connection Lost
            </h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-xs leading-relaxed">
              Your network connection is offline. Reconnect to restore your session and save your work.
            </p>
            <button
              onClick={onReconnect}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
            >
              <KeyRound className="h-4 w-4" />
              Reconnect Session
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 mb-4 animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight mb-2">
              Inactivity Warning
            </h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-xs leading-relaxed">
              You have been idle for a while. For your security, you will be logged out in:
            </p>
            
            {/* Circular or bold countdown display */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500/20">
                {/* Simulated progress ring */}
                <svg className="absolute -rotate-90 h-full w-full pointer-events-none">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-amber-500"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * (countdown / 60))}
                  />
                </svg>
                <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
                  {countdown}s
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={onExtend}
                className="w-full rounded-xl bg-violet-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
              >
                Keep Working
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
