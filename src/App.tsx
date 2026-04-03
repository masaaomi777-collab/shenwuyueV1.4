/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Game } from './components/Game';
import { MainMenu, LevelNavOverlay, IdleRewardOverlay } from './components/MainMenu';
import { SummonView } from './components/SummonView';
import { HeroDevelopmentView } from './components/HeroDevelopmentView';
import { FortressView } from './components/FortressView';
import { PlayerState, LevelConfig, HeroType } from './game/types';
import { LEVELS } from './game/constants';
import { assets } from './game/AssetManager';
import { Ghost, Home, User } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

const INITIAL_PLAYER_STATE: PlayerState = {
  upgradeTickets: 100,
  summonTickets: 20,
  gold: 10000,
  gems: 706,
  stamina: 172,
  maxStamina: 80,
  unlockedLevels: 1,
  prologueCompleted: false,
  heroes: {
    flame: { type: 'flame', level: 1, star: 1, shards: 0, isDeployed: true },
    ice: { type: 'ice', level: 1, star: 1, shards: 0, isDeployed: true },
    lightning: { type: 'lightning', level: 1, star: 1, shards: 0, isDeployed: true },
    wind: { type: 'wind', level: 1, star: 1, shards: 0, isDeployed: true },
    rock: { type: 'rock', level: 1, star: 1, shards: 0, isDeployed: false },
    shadow: { type: 'shadow', level: 1, star: 1, shards: 0, isDeployed: false },
  },
  formation: ['flame', 'ice', 'lightning', 'wind'],
};

type View = 'main_menu' | 'summon' | 'hero_dev' | 'fortress' | 'game';

export default function App() {
  const [view, setView] = useState<View>('main_menu');
  const [loading, setLoading] = useState(true);
  const [prologueEnabled, setPrologueEnabled] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem('playerState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...INITIAL_PLAYER_STATE, ...parsed, formation: parsed.formation || INITIAL_PLAYER_STATE.formation };
    }
    return INITIAL_PLAYER_STATE;
  });
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(LEVELS[0]);
  
  // Overlay states moved to App level to cover bottom nav
  const [showLevelNav, setShowLevelNav] = useState(false);
  const [showIdleReward, setShowIdleReward] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('playerState', JSON.stringify(playerState));
  }, [playerState]);

  const handleStartGame = (level: LevelConfig) => {
    setSelectedLevel(level);
    setView('game');
  };

  const getEffectivePlayerState = (): PlayerState => {
    if (!prologueEnabled) {
      return { ...playerState, prologueCompleted: true };
    }
    return playerState;
  };

  const handleGameOver = (result: 'win' | 'lose') => {
    if (result === 'win') {
      setPlayerState(prev => ({
        ...prev,
        upgradeTickets: prev.upgradeTickets + selectedLevel.rewardTickets,
        unlockedLevels: Math.max(prev.unlockedLevels, selectedLevel.id + 1)
      }));
    }
    setView('main_menu');
  };

  return (
    <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden p-0 sm:p-4">
      <div className="relative w-full max-w-[450px] aspect-[9/16] bg-black shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col border-x border-white/5">
        {/* Background for UI Views - Moved here to fill entire screen including bottom nav */}
        {view !== 'game' && !loading && (
          <div 
            className="absolute inset-0 bg-cover bg-bottom pointer-events-none z-0"
            style={{ backgroundImage: 'url(/res/UI/bg.jpg)' }}
          />
        )}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-mono tracking-widest animate-pulse">LOADING ASSETS...</p>
          </div>
        ) : view === 'game' ? (
          <Game 
            levelConfig={selectedLevel} 
            playerState={getEffectivePlayerState()} 
            onBack={() => setView('main_menu')}
            onGameOver={handleGameOver}
            onPrologueEnd={() => setPlayerState(prev => ({ ...prev, prologueCompleted: true }))}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto relative z-10">
              {view === 'main_menu' && (
                <MainMenu 
                  playerState={playerState} 
                  onStart={handleStartGame} 
                  prologueEnabled={prologueEnabled}
                  setPrologueEnabled={setPrologueEnabled}
                  showLevelNav={showLevelNav}
                  setShowLevelNav={setShowLevelNav}
                  showIdleReward={showIdleReward}
                  setShowIdleReward={setShowIdleReward}
                  setLevelIdx={(idx) => setSelectedLevel(LEVELS[idx])}
                />
              )}
              {view === 'summon' && (
                <SummonView 
                  playerState={playerState} 
                  setPlayerState={setPlayerState} 
                />
              )}
              {view === 'hero_dev' && (
                <HeroDevelopmentView 
                  playerState={playerState} 
                  setPlayerState={setPlayerState} 
                />
              )}
              {view === 'fortress' && (
                <FortressView 
                  playerState={playerState} 
                  setPlayerState={setPlayerState} 
                />
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="h-20 flex items-center justify-around px-4 relative z-20">
              <img src="/res/UI/bgbt.png" alt="" className="absolute inset-0 w-full h-full object-fill -z-10" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setView('summon')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'summon' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                <img src="/res/UI/btn_hl.png" alt="唤灵" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold tracking-widest text-[#d4af37]">唤灵</span>
              </button>
              <button 
                onClick={() => setView('main_menu')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'main_menu' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                <img src="/res/UI/btn_gx.png" alt="归墟" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold tracking-widest text-[#d4af37]">归墟</span>
              </button>
              <button 
                onClick={() => setView('hero_dev')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'hero_dev' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                <img src="/res/UI/btn_ts.png" alt="天师" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold tracking-widest text-[#d4af37]">天师</span>
              </button>
              <button 
                onClick={() => setView('fortress')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'fortress' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                <img src="/res/UI/btn_ts.png" alt="堡垒" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold tracking-widest text-[#d4af37]">堡垒</span>
              </button>
            </div>

            {/* Global Overlays (Rendered here to cover bottom nav) */}
            <AnimatePresence>
              {showLevelNav && (
                <div className="absolute inset-0 z-[100]">
                  <LevelNavOverlay 
                    playerState={playerState} 
                    onClose={() => setShowLevelNav(false)} 
                    onSelectLevel={(idx) => {
                      setSelectedLevel(LEVELS[idx]);
                      setShowLevelNav(false);
                    }}
                  />
                </div>
              )}
              {showIdleReward && (
                <div className="absolute inset-0 z-[100]">
                  <IdleRewardOverlay onClose={() => setShowIdleReward(false)} />
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
