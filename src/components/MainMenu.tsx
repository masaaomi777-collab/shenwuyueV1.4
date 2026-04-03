import React, { useState, useEffect } from 'react';
import { PlayerState, LevelConfig } from '../game/types';
import { LEVELS } from '../game/constants';
import { Play, Bell, Scroll, Ghost, Home, User, ChevronLeft, ChevronRight, Map, Trophy, Target, X, Gift, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MysticalCarriageCanvas } from './MysticalCarriageCanvas';

interface MainMenuProps {
  playerState: PlayerState;
  onStart: (level: LevelConfig) => void;
  prologueEnabled: boolean;
  setPrologueEnabled: (enabled: boolean) => void;
  showLevelNav: boolean;
  setShowLevelNav: (show: boolean) => void;
  showIdleReward: boolean;
  setShowIdleReward: (show: boolean) => void;
  setLevelIdx: (idx: number) => void;
}

const BG_URL = "/res/UI/bg.jpg";

// --- Sub-components for Overlays ---

export const LevelNavOverlay = ({ playerState, onClose, onSelectLevel }: { playerState: PlayerState, onClose: () => void, onSelectLevel: (idx: number) => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 z-[100] bg-black/95 flex flex-col p-6 backdrop-blur-sm"
  >
    <div className="flex justify-between items-center mb-6">
      <div className="flex flex-col">
        <h2 className="text-3xl font-black text-[#d4af37] tracking-widest italic">普通关卡</h2>
        <div className="h-1 w-12 bg-[#d4af37] mt-1" />
      </div>
      <button onClick={onClose} className="p-2 bg-gray-800/80 rounded-full text-white border border-white/10 active:scale-90 transition-transform">
        <X size={24} />
      </button>
    </div>
    
    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
      {LEVELS.map((level, idx) => {
        const isUnlocked = level.id <= playerState.unlockedLevels;
        return (
          <div key={level.id} className={`relative p-4 rounded-2xl border-2 transition-all ${isUnlocked ? 'border-[#d4af37]/40 bg-gradient-to-br from-gray-900 to-black' : 'border-gray-800 bg-gray-900/40 opacity-50'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="text-5xl font-black text-[#d4af37]/10 italic tracking-tighter">{level.id}</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-[#d4af37]">{level.id}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">{level.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={10} className="text-gray-500" />
                    <span className="text-[10px] text-gray-400 font-mono">{isUnlocked ? '03:29' : '--:--'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => isUnlocked && (onSelectLevel(idx), onClose())}
                className={`px-4 py-2 rounded-xl font-black text-xs tracking-widest shadow-lg active:translate-y-0.5 transition-all ${isUnlocked ? 'bg-gradient-to-b from-[#f3d06a] to-[#d4af37] text-black border-b-4 border-[#a68a2d]' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
              >
                {isUnlocked ? '前往挑战' : '未解锁'}
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: '成功通关', icon: '💰', val: '500', color: 'text-yellow-500' },
                { label: '6分30秒', icon: '📜', val: '300', color: 'text-blue-400' },
                { label: '6分钟内', icon: '💎', val: '100', color: 'text-green-400' }
              ].map((r, i) => (
                <div key={i} className="bg-black/40 rounded-xl p-2 border border-white/5 flex flex-col items-center">
                  <span className="text-[8px] text-gray-500 font-bold mb-1">{r.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{r.icon}</span>
                    <span className="text-white text-[10px] font-black">{r.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
    
    <div className="mt-6 bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-2xl border border-[#d4af37]/20 flex items-center justify-between shadow-xl">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-500 font-bold">待完美通关</span>
        <span className="text-xs text-orange-400 font-black tracking-wider">3. 漠迹探踪</span>
      </div>
      <button className="px-4 py-2 bg-orange-500/20 text-orange-400 text-[10px] font-black rounded-xl border border-orange-500/30 hover:bg-orange-500/30 transition-colors">
        立即前往
      </button>
    </div>
  </motion.div>
);

export const IdleRewardOverlay = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "100%" }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
    className="absolute bottom-0 left-0 right-0 z-[100] h-[70%] bg-[#121212] rounded-t-[40px] border-t-4 border-[#d4af37]/40 flex flex-col overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
  >
    <div className="relative h-60 w-full overflow-hidden shrink-0">
      <img src="/res/background.png" alt="" className="w-full h-full object-cover opacity-40 scale-110" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
      
      <div className="absolute top-6 left-8">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-[#d4af37]" />
          <h2 className="text-2xl font-black text-white italic tracking-tighter">
            <span className="text-[#d4af37]">巡</span>逻奖励
          </h2>
        </div>
      </div>
      
      <button onClick={onClose} className="absolute top-6 right-8 p-1.5 bg-black/60 rounded-full text-white border border-white/10 active:scale-90 transition-transform z-20">
        <X size={18} />
      </button>
      
      {/* Combined Animation & Earnings */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-24 h-24 bg-[#d4af37]/20 rounded-full blur-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
          <motion.img 
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            src="/res/role/Fire/fire-run/fengguanxiapei_nv-run_0.png" 
            alt="" 
            className="w-20 h-20 object-contain relative z-10" 
            referrerPolicy="no-referrer" 
          />
        </div>
        
        <div className="mt-2 bg-black/80 px-4 py-1 rounded-full border border-[#d4af37]/30 shadow-lg z-10">
          <div className="flex items-center gap-2">
            <Clock size={10} className="text-[#d4af37]" />
            <span className="text-[10px] text-white font-black font-mono tracking-widest">10:00:00</span>
          </div>
        </div>
      </div>

      {/* Floating Earnings Badges */}
      <div className="absolute bottom-4 left-8 right-8 flex justify-between items-center">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-xl">
          <span className="text-base">💰</span>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white">102</span>
            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter">/ 小时</span>
          </div>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-xl">
          <span className="text-base">📜</span>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white">18</span>
            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter">/ 小时</span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-2">
        <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">获得物品</span>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} className="aspect-square bg-gray-900 rounded-xl border border-white/5 flex items-center justify-center relative group active:scale-95 transition-transform overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="text-xl drop-shadow-md">🎁</span>
              <div className="absolute bottom-0.5 right-1">
                <span className="text-[8px] font-black text-white drop-shadow-lg">x{i * 2}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-2 flex gap-3">
        <button className="flex-1 h-14 bg-gray-900 rounded-2xl border-2 border-gray-800 flex flex-col items-center justify-center group active:scale-95 transition-all shadow-xl">
          <div className="flex items-center gap-1">
            <span className="text-lg">🍗</span>
            <span className="text-white font-black text-base tracking-tighter">x5</span>
          </div>
          <span className="text-[8px] text-gray-500 font-black uppercase">快速扫荡</span>
        </button>
        <button className="flex-[2] h-14 bg-gradient-to-b from-[#f3d06a] to-[#d4af37] rounded-2xl border-b-4 border-black/20 flex items-center justify-center active:translate-y-1 active:border-b-2 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)]">
          <span className="text-lg font-black text-black tracking-[0.2em] italic">领取奖励</span>
        </button>
      </div>
    </div>
  </motion.div>
);

// --- Main Menu Component ---

const QUESTS = [
  { id: 1, text: '通关第1关', target: '1/1', completed: true },
  { id: 2, text: '通关第2关', target: '0/1', completed: false },
  { id: 3, text: '通关第3关', target: '0/1', completed: false },
  { id: 4, text: '升级英雄1次', target: '0/1', completed: false },
];

export function MainMenu({ 
  playerState, 
  onStart, 
  prologueEnabled, 
  setPrologueEnabled,
  showLevelNav,
  setShowLevelNav,
  showIdleReward,
  setShowIdleReward,
  setLevelIdx
}: MainMenuProps) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  
  const currentLevel = LEVELS[currentLevelIdx];
  const isUnlocked = currentLevel.id <= playerState.unlockedLevels;

  // Find the first uncompleted quest
  const currentQuest = QUESTS.find(q => !q.completed) || QUESTS[QUESTS.length - 1];

  return (
    <div className="relative h-full w-full flex flex-col items-center overflow-hidden bg-transparent">
      {/* Top Resource Bar */}
      <div className="relative z-[60] w-full pt-4 px-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* Avatar & Power */}
          <div className="flex items-center gap-2 bg-black/40 p-1 pr-4 rounded-full border border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600 border-2 border-white/20 flex items-center justify-center text-xl shadow-lg">
              👤
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-orange-400 font-black italic">LV.6</span>
                <span className="text-white font-bold text-xs">玩家姓名</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-[10px]">👊</span>
                <span className="text-yellow-500 font-black text-xs">1587</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-white/10">
              <span className="text-sm">💰</span>
              <span className="text-white font-bold text-xs">{playerState.gold >= 10000 ? (playerState.gold / 10000).toFixed(0) + '万' : playerState.gold}</span>
              <span className="text-orange-400 font-bold ml-1">+</span>
            </div>
            <div className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-white/10">
              <span className="text-sm">💎</span>
              <span className="text-white font-bold text-xs">{playerState.gems}</span>
              <span className="text-orange-400 font-bold ml-1">+</span>
            </div>
            <div className="flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full border border-white/10">
              <span className="text-sm">🍗</span>
              <span className="text-white font-bold text-xs">{playerState.stamina}/{playerState.maxStamina}</span>
              <span className="text-orange-400 font-bold ml-1">+</span>
            </div>
          </div>
        </div>
        
        {/* Secondary Resources (Scrolls & Hats) */}
        <div className="flex justify-end gap-2">
          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
            <img src="/res/UI/miquan.png" alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
            <span className="text-white font-bold text-[10px]">{playerState.upgradeTickets}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
            <img src="/res/UI/shengguanmao.png" alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
            <span className="text-white font-bold text-[10px]">{playerState.summonTickets}</span>
          </div>
        </div>
      </div>

      {/* Level Display Section */}
      <div className="relative z-20 flex flex-col items-center w-full mt-8">
        <div className="relative flex flex-col items-center">
          <div className="text-center min-w-[280px] relative py-6 px-10">
            <img 
              src="/res/bg_name.png" 
              alt="" 
              className="absolute inset-0 w-full h-full object-fill -z-10 opacity-90" 
              referrerPolicy="no-referrer"
            />
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-4xl font-black tracking-tighter text-[#d4af37] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] italic">
                {currentLevelIdx + 1}.{currentLevel.name}
              </h2>
              <button 
                onClick={() => setShowLevelNav(true)}
                className="p-1 bg-black/40 rounded-lg border border-[#d4af37]/30 text-[#d4af37] hover:scale-110 transition-transform"
              >
                <Map size={20} />
              </button>
            </div>
            <p className="mt-1 text-[10px] tracking-[0.3em] text-[#d4af37]/80 uppercase font-black">最高纪录: 03:29 <span className="underline ml-2">详情</span></p>
          </div>

          {/* Level Rewards (Below Name) */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-900/80 rounded-lg border-2 border-yellow-500/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
                <span className="text-xl">💰</span>
                <div className="absolute bottom-0 right-0 bg-black/60 px-1 rounded-tl-md">
                  <span className="text-[8px] text-white font-bold">500</span>
                </div>
              </div>
              <span className="text-[8px] text-gray-400 mt-1">成功通关</span>
            </div>
            <div className="w-8 h-[2px] bg-[#d4af37]/30 -mt-4" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-900/80 rounded-lg border-2 border-blue-500/50 flex items-center justify-center relative">
                <span className="text-xl">📜</span>
                <div className="absolute bottom-0 right-0 bg-black/60 px-1 rounded-tl-md">
                  <span className="text-[8px] text-white font-bold">300</span>
                </div>
              </div>
              <span className="text-[8px] text-gray-400 mt-1">6分30秒</span>
            </div>
            <div className="w-8 h-[2px] bg-[#d4af37]/30 -mt-4" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-900/80 rounded-lg border-2 border-green-500/50 flex items-center justify-center relative">
                <span className="text-xl">💎</span>
                <div className="absolute bottom-0 right-0 bg-black/60 px-1 rounded-tl-md">
                  <span className="text-[8px] text-white font-bold">100</span>
                </div>
              </div>
              <span className="text-[8px] text-gray-400 mt-1">6分钟内</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Wrapper */}
      <div className="relative z-10 flex-1 w-full flex flex-col items-center">
        {/* Centerpiece: The Floor Image */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md aspect-video flex items-center justify-center">
          <button 
            onClick={() => {
              const newIdx = Math.max(0, currentLevelIdx - 1);
              setCurrentLevelIdx(newIdx);
              setLevelIdx(newIdx);
            }}
            disabled={currentLevelIdx === 0}
            className="absolute left-0 p-2 disabled:opacity-20 hover:scale-110 transition-transform z-30 pointer-events-auto"
          >
            <img src="/res/UI/btn_left.png" alt="Previous" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel.id}
              initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateY: 20 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-full flex items-center justify-center pointer-events-none"
            >
              <img 
                src="/res/UI/car.png" 
                alt="Car" 
                className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>

          <button 
            onClick={() => {
              const newIdx = Math.min(LEVELS.length - 1, currentLevelIdx + 1);
              setCurrentLevelIdx(newIdx);
              setLevelIdx(newIdx);
            }}
            disabled={currentLevelIdx === LEVELS.length - 1}
            className="absolute right-0 p-2 disabled:opacity-20 hover:scale-110 transition-transform z-30 pointer-events-auto"
          >
            <img src="/res/UI/btn_left.png" alt="Next" className="w-12 h-12 object-contain scale-x-[-1]" referrerPolicy="no-referrer" />
          </button>
        </div>

        {/* Action Section */}
        <div className="mt-auto mb-16 flex flex-col items-center w-full px-6">
          <div className="flex items-center justify-center gap-4 w-full max-w-xs">
            {/* Idle Reward Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowIdleReward(true)}
              className="relative w-20 h-20 flex flex-col items-center justify-center group"
            >
              <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-lg group-hover:bg-orange-500/40 transition-all" />
              <div className="relative w-16 h-16 bg-gray-900/80 rounded-2xl border-2 border-orange-500/50 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute top-0 left-0 bg-red-600 text-[8px] text-white px-1 font-bold rounded-br-md z-10">收益已满</div>
                <span className="text-3xl">🧺</span>
                <span className="text-[10px] text-orange-400 font-bold mt-1">巡逻奖励</span>
              </div>
            </motion.button>

            {/* Start Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => isUnlocked && onStart(currentLevel)}
              disabled={!isUnlocked}
              className={`group relative transition-all flex flex-col items-center justify-center ${!isUnlocked ? 'opacity-50 grayscale' : 'hover:brightness-110'}`}
            >
              <img src="/res/UI/btn_start.png" alt="" className="w-56 h-auto object-contain" referrerPolicy="no-referrer" />
              <div className="absolute flex flex-col items-center -translate-y-1">
                <span className="text-white font-black text-3xl tracking-[0.2em] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] italic">
                  {isUnlocked ? '开始作战' : '未解锁'}
                </span>
                {isUnlocked && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg">🍗</span>
                    <span className="text-white font-black text-sm drop-shadow-md">5</span>
                  </div>
                )}
              </div>
            </motion.button>

            {/* Task Indicator / Quest Plate (Right Side) */}
            <div className="relative w-24 h-20 flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg" />
              <div className="relative w-20 h-16 bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl border-2 border-[#d4af37]/40 flex flex-col items-center justify-center overflow-hidden p-1 shadow-xl">
                <div className="flex items-center gap-1 mb-0.5">
                  <Scroll size={10} className="text-[#d4af37]" />
                  <span className="text-[8px] text-[#d4af37] font-black tracking-widest uppercase italic">当前任务</span>
                </div>
                <div className="w-full text-center">
                  <p className="text-[9px] text-white font-bold leading-tight line-clamp-2 px-1">{currentQuest.text}</p>
                  <div className="mt-1 bg-black/50 rounded-full px-1.5 py-0.5 inline-block border border-white/10">
                    <span className="text-[8px] text-blue-400 font-mono font-black">{currentQuest.target}</span>
                  </div>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays (Removed from here, managed by App.tsx) */}

      {/* Prologue Toggle & Reset (Top Right - Adjusted) */}
      <div className="absolute top-24 right-4 flex flex-col items-end gap-2 z-20">
        <button 
          onClick={() => setPrologueEnabled(!prologueEnabled)}
          className={`px-2 py-1 rounded-md border transition-all text-[8px] font-bold tracking-wider flex items-center gap-1 ${
            prologueEnabled 
              ? 'bg-blue-900/40 text-blue-400 border-blue-500/50' 
              : 'bg-gray-900/40 text-gray-500 border-gray-700/50'
          }`}
        >
          首局体验: {prologueEnabled ? '开' : '关'}
        </button>
        
        <button 
          onClick={() => {
            if (window.confirm('确定要清除所有本地存档吗？')) {
              localStorage.removeItem('playerState');
              window.location.reload();
            }
          }}
          className="text-[8px] text-gray-600 hover:text-gray-400 px-2 py-1"
        >
          清除存档
        </button>
      </div>
    </div>
  );
}

