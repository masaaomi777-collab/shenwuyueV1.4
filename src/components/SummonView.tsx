import React, { useState } from 'react';
import { PlayerState, HeroType } from '../game/types';
import { Sparkles, Coins, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SummonViewProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

export function SummonView({ playerState, setPlayerState }: SummonViewProps) {
  const [summoning, setSummoning] = useState<'hero' | 'totem' | null>(null);
  const [result, setResult] = useState<{ type: HeroType, count: number } | null>(null);

  const handleSummonHero = () => {
    if (playerState.summonTickets < 10) return;

    setSummoning('hero');
    setResult(null);

    setTimeout(() => {
      const types: HeroType[] = ['flame', 'ice', 'lightning', 'wind', 'rock', 'shadow'];
      const type = types[Math.floor(Math.random() * types.length)];
      const count = 10 + Math.floor(Math.random() * 10); // 10-20 shards

      setPlayerState(prev => ({
        ...prev,
        summonTickets: prev.summonTickets - 10,
        heroes: {
          ...prev.heroes,
          [type]: {
            ...prev.heroes[type],
            shards: prev.heroes[type].shards + count
          }
        }
      }));

      setResult({ type, count });
    }, 1500);
  };

  const handleSummonTotem = () => {
    if (playerState.gems < 100) return;

    setSummoning('totem');
    setResult(null);

    setTimeout(() => {
      setPlayerState(prev => ({
        ...prev,
        gems: prev.gems - 100
      }));
      // Mock totem result
      setResult({ type: 'rock', count: 1 });
    }, 1500);
  };

  const getElementColor = (type: HeroType) => {
    switch (type) {
      case 'flame': return 'text-red-500';
      case 'ice': return 'text-blue-400';
      case 'lightning': return 'text-yellow-400';
      case 'wind': return 'text-teal-400';
      case 'rock': return 'text-amber-700';
      case 'shadow': return 'text-purple-500';
      default: return 'text-gray-400';
    }
  };

  const getHeroName = (type: HeroType) => {
    switch (type) {
      case 'flame': return '火神';
      case 'ice': return '冰后';
      case 'lightning': return '雷公';
      case 'wind': return '风伯';
      case 'rock': return '岩王';
      case 'shadow': return '影魔';
      default: return type;
    }
  };

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

      {/* Top Character Area */}
      <div className="h-40 relative flex items-end justify-center">
        <div className="absolute top-0 left-0 w-full h-8 bg-purple-300/20 rounded-b-[50%] blur-sm" />
        <img src="/res/role/C001/run_1.png" alt="King" className="w-32 h-32 object-contain drop-shadow-xl" referrerPolicy="no-referrer" />
      </div>

      {/* Scrollable Banners */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar flex flex-col gap-6">
        
        {/* Hero Summon Banner */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-8 flex items-center justify-center mb-2">
            <div className="absolute inset-0 bg-[#4a90e2] transform skew-x-[-20deg] border border-[#7ab8ff]" />
            <span className="relative text-white font-bold tracking-widest text-sm">英雄招募</span>
          </div>
          
          <div className="w-full bg-[#f4e8c1] rounded-2xl p-2 border-4 border-[#e5b940] shadow-lg relative overflow-hidden">
            <div className="absolute top-2 left-2 flex flex-col items-center z-10">
              <div className="w-10 h-10 bg-[#8a5a19] rounded-full border-2 border-[#e5b940] flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <span className="text-[8px] text-[#8a5a19] font-bold mt-1">英雄兑换</span>
            </div>
            
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <span className="text-xs font-black text-black">Lv.1</span>
              <div className="w-24 h-3 bg-black/40 rounded-full border border-black/20 overflow-hidden relative">
                <div className="absolute left-0 top-0 h-full bg-green-500 w-[15%]" />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">48/300</span>
              </div>
              <div className="w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</div>
            </div>

            <div className="h-32 bg-[#8bc34a] rounded-xl mt-4 relative flex flex-col items-center justify-center overflow-hidden border-2 border-[#7cb342]">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#fff_0%,transparent_70%)]" />
              <div className="w-24 h-24 bg-red-500 rounded-full border-4 border-yellow-500 flex items-center justify-center shadow-xl z-10">
                <span className="text-4xl text-white">🔥</span>
              </div>
              <div className="absolute bottom-2 flex justify-center w-full z-20">
                <button 
                  onClick={handleSummonHero}
                  className="px-6 py-2 bg-gradient-to-b from-[#f4d570] to-[#e5b940] rounded-xl border-b-4 border-[#8a5a19] shadow-lg active:translate-y-1 active:border-b-0 transition-all flex flex-col items-center"
                >
                  <span className="text-black font-black text-sm">擂鼓招募</span>
                  <div className="flex items-center gap-1">
                    <img src="/res/UI/shengguanmao.png" className="w-3 h-3" alt="" referrerPolicy="no-referrer" />
                    <span className="text-black text-[10px] font-bold">{playerState.summonTickets}/10</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Totem Summon Banner */}
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-8 flex items-center justify-center mb-2">
            <div className="absolute inset-0 bg-[#5c6bc0] transform skew-x-[-20deg] border border-[#8c9eff]" />
            <span className="relative text-white font-bold tracking-widest text-sm">图腾寻宝</span>
          </div>
          
          <div className="w-full bg-gradient-to-b from-[#81d4fa] to-[#29b6f6] rounded-2xl p-4 border-4 border-[#e1f5fe] shadow-lg relative overflow-hidden flex flex-col items-center justify-center h-40">
            <div className="absolute top-2 right-2 flex flex-col items-center z-10">
              <div className="w-8 h-8 bg-white/20 rounded-lg border border-white/50 flex items-center justify-center">
                <span className="text-sm">📋</span>
              </div>
              <span className="text-[8px] text-white font-bold mt-1">概率</span>
            </div>

            <div className="flex items-center justify-center w-full relative">
              <div className="w-32 h-24 bg-blue-300/50 rounded-2xl border-2 border-blue-200 flex items-center justify-center shadow-2xl relative z-10">
                <span className="text-5xl">💎</span>
              </div>
              <div className="absolute right-4 top-0 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🎭</span>
              </div>
              <div className="absolute right-12 bottom-0 w-12 h-12 bg-black/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💀</span>
              </div>
            </div>

            <div className="absolute bottom-2 w-full text-center z-20">
              <span className="text-[10px] font-black text-white drop-shadow-md">剩余 <span className="text-yellow-300 text-xs">10</span> 次必定获得卓越图腾</span>
            </div>
            
            <button 
              onClick={handleSummonTotem}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />
          </div>
        </div>

      </div>

      {/* Summoning Animation Overlay */}
      <AnimatePresence>
        {summoning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center"
          >
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-32 h-32 border-8 border-dashed border-yellow-500 rounded-full flex items-center justify-center"
            >
              <span className="text-4xl">{summoning === 'hero' ? '🔥' : '💎'}</span>
            </motion.div>
            <p className="mt-8 text-yellow-500 font-bold tracking-widest animate-pulse">
              {summoning === 'hero' ? '正在招募英雄...' : '正在寻宝...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Overlay */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-6"
          >
            <h2 className="text-3xl font-black text-yellow-500 mb-8 tracking-widest">获得奖励</h2>
            
            <div className="w-40 h-40 bg-gradient-to-b from-gray-800 to-black rounded-3xl border-4 border-yellow-500 flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(234,179,8,0.3)]">
              <span className="text-6xl mb-2">{result.type === 'rock' ? '🎭' : '👤'}</span>
              <span className={`text-xl font-bold ${getElementColor(result.type)}`}>
                {getHeroName(result.type)}
              </span>
              <div className="absolute -bottom-4 bg-yellow-500 text-black px-4 py-1 rounded-full font-black border-2 border-yellow-700">
                x{result.count}
              </div>
            </div>

            <button 
              onClick={() => setResult(null)}
              className="mt-16 px-12 py-3 bg-white/10 rounded-full font-bold border border-white/20 active:bg-white/20 transition-colors"
            >
              点击继续
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

