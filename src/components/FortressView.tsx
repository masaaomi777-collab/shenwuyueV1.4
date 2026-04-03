import React, { useState } from 'react';
import { PlayerState } from '../game/types';
import { motion } from 'motion/react';

interface FortressViewProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

export function FortressView({ playerState, setPlayerState }: FortressViewProps) {
  const [activeTab, setActiveTab] = useState<'totem' | 'equip'>('totem');

  return (
    <div className="h-full flex flex-col bg-transparent text-white overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <div className="flex gap-4">
          <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <span className="text-sm">💎</span>
            <span className="text-xs font-bold text-white">{playerState.gems}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <span className="text-sm">💰</span>
            <span className="text-xs font-bold text-white">{playerState.gold}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col items-center">
        {/* Character / Car Area */}
        <div className="absolute top-10 left-4 w-48 h-64 flex items-center justify-center">
          <img src="/res/UI/car.png" alt="Car" className="w-full h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" referrerPolicy="no-referrer" />
          <div className="absolute bottom-0 bg-black/60 px-4 py-1 rounded-full border border-yellow-500/50">
            <span className="text-yellow-500 font-black italic">⚔ 266</span>
          </div>
        </div>

        {/* Equipment Slots (Right Side) */}
        <div className="absolute top-10 right-4 grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="w-16 h-20 bg-white/10 rounded-xl border-2 border-white/20 flex flex-col items-center p-1 relative">
              <div className="absolute top-0 left-0 bg-orange-500 text-[8px] px-1 rounded-br-lg font-bold">10级</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 bg-black/40 rounded-full border border-white/10" />
              </div>
              <div className="w-full flex justify-center gap-0.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Enhance Button */}
        <div className="absolute top-[320px] right-4">
          <button className="px-8 py-2 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-xl text-black font-black text-lg shadow-[0_4px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none">
            强化
          </button>
        </div>
      </div>

      {/* Bottom Inventory Area */}
      <div className="h-64 bg-[#e8e4d9] rounded-t-3xl p-4 flex flex-col">
        {/* Tabs */}
        <div className="flex bg-[#c4bca3] rounded-full p-1 mb-4">
          <button 
            onClick={() => setActiveTab('totem')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'totem' ? 'bg-gradient-to-b from-[#f4d570] to-[#e5b940] text-[#8a5a19] shadow-md' : 'text-[#8a7b66]'}`}
          >
            图腾
          </button>
          <button 
            onClick={() => setActiveTab('equip')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'equip' ? 'bg-gradient-to-b from-[#f4d570] to-[#e5b940] text-[#8a5a19] shadow-md' : 'text-[#8a7b66]'}`}
          >
            装备
          </button>
          <button className="flex-1 py-2 rounded-full text-sm font-bold text-[#8a7b66]">
            材料
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-5 gap-2 overflow-y-auto custom-scrollbar">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
            <div key={i} className="aspect-square bg-[#d4cdb3] rounded-lg border-2 border-[#b8b096] flex items-center justify-center relative shadow-inner">
              {i <= 4 && activeTab === 'totem' && (
                <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🎭</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-2 mt-2">
          <button className="w-10 h-10 bg-[#5a7b8c] rounded-full flex items-center justify-center text-white shadow-md">
            <span className="text-lg">Filter</span>
          </button>
          <button className="px-6 py-2 bg-[#5a7b8c] rounded-full text-white font-bold shadow-md">
            合成
          </button>
        </div>
      </div>
    </div>
  );
}
