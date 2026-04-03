import React, { useState, useRef } from 'react';
import { PlayerState, HeroType, PlayerHero } from '../game/types';
import { SKILL_TREES } from '../game/constants';
import { 
  Zap, Flame, Snowflake, Wind, Mountain, Ghost, 
  X, Shield, Swords, Star, Info, ChevronRight,
  ArrowUpCircle, Lock, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroDevelopmentViewProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
}

const HERO_IMAGES: Record<HeroType, string> = {
  flame: '/res/role/Fire/fire-run/fengguanxiapei_nv-run_0.png',
  ice: '/res/role/Ice/ice-run/run_1.png',
  lightning: '/res/role/Thunder/thunder-run/erlangzhenjun-run_0.png',
  wind: '/res/role/Wind/wind-run/huawuxin-run_0.png',
  rock: '/res/role/C001/run_1.png',
  shadow: '/res/role/M002/shanzei-run_0.png',
};

const ELEMENT_ICONS: Record<HeroType, string> = {
  flame: '/res/UI/fire.png',
  ice: '/res/UI/ice.png',
  lightning: '/res/UI/thunder.png',
  wind: '/res/UI/wind.png',
  rock: '/res/UI/erhe.png',
  shadow: '/res/UI/hulu.png',
};

export function HeroDevelopmentView({ playerState, setPlayerState }: HeroDevelopmentViewProps) {
  const [selectedHero, setSelectedHero] = useState<HeroType | null>(null);
  const [draggedHero, setDraggedHero] = useState<HeroType | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const formation = playerState.formation || ['flame', 'ice', 'lightning', 'wind'];

  const handleUpgrade = (type: HeroType) => {
    const hero = playerState.heroes[type];
    const cost = hero.level * 10;
    if (playerState.upgradeTickets < cost) return;

    setPlayerState(prev => ({
      ...prev,
      upgradeTickets: prev.upgradeTickets - cost,
      heroes: {
        ...prev.heroes,
        [type]: {
          ...prev.heroes[type],
          level: prev.heroes[type].level + 1
        }
      }
    }));
  };

  const replaceInFormation = (slotIdx: number, newHeroType: HeroType) => {
    const existingIdx = formation.indexOf(newHeroType);
    
    setPlayerState(prev => {
      const newFormation = [...(prev.formation || ['flame', 'ice', 'lightning', 'wind'])];
      if (existingIdx !== -1) {
        const temp = newFormation[slotIdx];
        newFormation[slotIdx] = newHeroType;
        newFormation[existingIdx] = temp;
      } else {
        newFormation[slotIdx] = newHeroType;
      }
      
      const newHeroes = { ...prev.heroes };
      Object.keys(newHeroes).forEach(key => {
        const type = key as HeroType;
        newHeroes[type] = {
          ...newHeroes[type],
          isDeployed: newFormation.includes(type)
        };
      });

      return { ...prev, formation: newFormation, heroes: newHeroes };
    });
  };

  const handleDragEnd = (event: any, info: any, heroType: HeroType) => {
    setDraggedHero(null);
    const x = info.point.x;
    const y = info.point.y;

    slotRefs.current.forEach((slot, idx) => {
      if (slot) {
        const rect = slot.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          replaceInFormation(idx, heroType);
        }
      }
    });
  };

  const calculatePower = () => {
    return formation.reduce((acc, type) => {
      if (!type) return acc;
      const h = playerState.heroes[type];
      if (!h) return acc;
      return acc + (h.level * 50 + h.star * 100);
    }, 0);
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
    <div className="h-full flex flex-col bg-transparent text-white overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-sm border-b border-white/5 z-10">
        <div className="flex gap-4">
          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
            <img src="/res/UI/icon_coin.png" className="w-4 h-4" alt="" referrerPolicy="no-referrer" />
            <span className="text-xs font-bold text-yellow-500">{playerState.gold}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
            <img src="/res/UI/miquan.png" className="w-4 h-4" alt="" referrerPolicy="no-referrer" />
            <span className="text-xs font-bold text-blue-400">{playerState.upgradeTickets}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
          <span className="text-[10px] text-gray-400">体力</span>
          <span className="text-xs font-bold text-green-400">{playerState.stamina}/{playerState.maxStamina}</span>
        </div>
      </div>

      {/* Formation Area */}
      <div className="relative flex-shrink-0 py-6 flex flex-col items-center gap-4 bg-gradient-to-b from-black/20 to-transparent z-10">
        <div className="flex gap-3 justify-center">
          {formation.map((type, idx) => (
            <div 
              key={idx}
              ref={el => slotRefs.current[idx] = el}
              className={`relative w-20 h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${type ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-dashed border-white/10 bg-white/5'}`}
            >
              {type ? (
                <>
                  <img src={HERO_IMAGES[type]} className="w-16 h-16 object-contain drop-shadow-2xl" alt="" referrerPolicy="no-referrer" />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-black/60 rounded-full border border-white/20 flex items-center justify-center">
                    <img src={ELEMENT_ICONS[type]} className="w-4 h-4" alt="" referrerPolicy="no-referrer" />
                  </div>
                </>
              ) : (
                <Plus className="text-white/10" size={24} />
              )}
            </div>
          ))}
        </div>

        {/* Formation Tabs */}
        <div className="flex gap-2">
          {[1, 2, 3].map(n => (
            <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${n === 1 ? 'bg-yellow-500 border-yellow-300 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
              {n}
            </div>
          ))}
        </div>

        {/* Power Score */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-900/40 via-blue-800/60 to-blue-900/40 border border-blue-500/30 px-8 py-2 rounded-full shadow-lg">
          <Swords size={18} className="text-yellow-500" />
          <span className="text-2xl font-black italic tracking-tighter text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">{calculatePower()}</span>
        </div>
      </div>

      {/* Hero List */}
      <div className="flex-1 bg-black/40 rounded-t-[40px] border-t border-white/10 p-6 flex flex-col gap-4 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase flex items-center gap-2">
            <Star size={14} className="text-yellow-500" /> 英雄列表
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            暴击伤害增幅: <span className="text-yellow-500 font-bold">142.2%</span>
            <Info size={12} className="text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 overflow-y-auto pb-10 no-scrollbar">
          {(Object.keys(playerState.heroes) as HeroType[]).map((type) => {
            const hero = playerState.heroes[type];
            const isDeployed = formation.includes(type);

            return (
              <motion.div
                key={type}
                drag
                dragSnapToOrigin
                onDragStart={() => setDraggedHero(type)}
                onDragEnd={(e, info) => handleDragEnd(e, info, type)}
                whileDrag={{ scale: 1.2, zIndex: 100, opacity: 0.8 }}
                onClick={() => !draggedHero && setSelectedHero(type)}
                className={`relative aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-between p-2 transition-all cursor-pointer ${isDeployed ? 'border-blue-500 bg-blue-900/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/10 bg-white/5'}`}
              >
                <div className="absolute top-1 left-1 bg-black/40 rounded-full p-0.5">
                  <img src={ELEMENT_ICONS[type]} className="w-3 h-3" alt="" referrerPolicy="no-referrer" />
                </div>
                
                <img src={HERO_IMAGES[type]} className="w-12 h-12 object-contain mt-2 pointer-events-none" alt="" referrerPolicy="no-referrer" />
                
                <div className="w-full flex flex-col items-center gap-1">
                  {isDeployed && (
                    <div className="bg-red-500 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase shadow-lg">出战中</div>
                  )}
                  <div className="w-full bg-black/60 rounded-full h-3 flex items-center px-1 relative overflow-hidden border border-white/5">
                    <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${(hero.shards / 30) * 100}%` }} />
                    <span className="relative z-10 text-[8px] font-black w-full text-center drop-shadow-md">{hero.level} {hero.shards}/30</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{getHeroName(type)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hero Detail Modal */}
      <AnimatePresence>
        {selectedHero && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#222] rounded-[40px] border-4 border-white/10 overflow-hidden flex flex-col shadow-2xl"
            >
              <button 
                onClick={() => setSelectedHero(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:text-white z-20 border border-white/10"
              >
                <X size={28} />
              </button>

              {/* Modal Header */}
              <div className="relative h-56 flex items-center justify-center bg-gradient-to-b from-blue-900/40 to-transparent">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2)_0%,transparent_70%)]" />
                <img src={HERO_IMAGES[selectedHero]} className="w-40 h-40 object-contain drop-shadow-[0_0_50px_rgba(59,130,246,0.6)] relative z-10" alt="" referrerPolicy="no-referrer" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                      <span className="text-xl font-black italic text-yellow-500">LV.{playerState.heroes[selectedHero].level}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-widest drop-shadow-lg">{getHeroName(selectedHero)}</h2>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto no-scrollbar">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/30">
                      <Swords size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">伤害</span>
                      <span className="text-xl font-black italic text-yellow-500">{20 + playerState.heroes[selectedHero].level * 10}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/30">
                      <Shield size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">职业</span>
                      <span className="text-sm font-black">战士</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex justify-center gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center relative ${i === 1 ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-white/5 bg-black/40 opacity-40'}`}>
                      {i === 1 ? <Zap size={32} className="text-blue-400" /> : <Lock size={24} />}
                      {i > 1 && <div className="absolute -bottom-2 bg-black/80 text-[8px] px-2 py-0.5 rounded border border-white/10">LV.{i * 5}</div>}
                    </div>
                  ))}
                </div>

                {/* Unlocks */}
                <div className="flex flex-col gap-3">
                  {[5, 10, 15, 20, 25].map(lv => (
                    <div key={lv} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[10px] font-black border border-white/10">
                          LV.{lv}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">解锁新技能或属性加成</span>
                      </div>
                      <Lock size={16} className="text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-black/40 border-t border-white/10 flex flex-col gap-6">
                <div className="flex justify-center gap-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                      <img src="/res/UI/miquan.png" className="w-8 h-8" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-xs font-black text-blue-400">187/36</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                      <img src={HERO_IMAGES[selectedHero]} className="w-8 h-8 object-contain" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <span className="text-xs font-black text-red-400">0/10</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleUpgrade(selectedHero)}
                  className="w-full py-5 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-[24px] text-black font-black text-2xl shadow-[0_6px_0_rgb(180,83,9)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest"
                >
                  升级
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
