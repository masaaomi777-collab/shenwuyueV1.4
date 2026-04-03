import React from 'react';
import { Zap, Shield, Sword, Flame, Snowflake, Wind, Mountain, Ghost } from 'lucide-react';
import { SkillNode, HeroType } from '../game/types';

export function SkillSelection({ choices, onSelect }: { choices: SkillNode[], onSelect: (id: string) => void }) {
  
  const getIcon = (type: HeroType) => {
    const iconMap: Record<string, string> = {
      'flame': '/res/UI/skill_fire.png',
      'ice': '/res/UI/skill_ice.png',
      'lightning': '/res/UI/skill_thunder.png',
      'wind': '/res/UI/skill_wind.png'
    };
    const src = iconMap[type];
    if (src) {
      return <img src={src} className="w-full h-full object-contain" referrerPolicy="no-referrer" />;
    }
    switch(type) {
      case 'rock': return <Mountain size={24} className="text-amber-600" />;
      case 'shadow': return <Ghost size={24} className="text-purple-400" />;
      default: return <Sword size={24} className="text-gray-400" />;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div 
        className="bg-contain bg-no-repeat bg-center p-8 w-full max-w-md shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-200"
        style={{ backgroundImage: `url('/res/UI/sanxuan.png')`, minHeight: '533px' }}
      >
        <div className="text-center mt-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">能量充满！</h2>
          <p className="text-gray-700 text-sm">选择一项技能强化你的英雄</p>
        </div>

        <div className="flex flex-col gap-4">
          {choices.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="bg-contain bg-no-repeat bg-center p-4 flex items-center gap-4 transition-all text-left group hover:scale-105 active:scale-95"
              style={{ backgroundImage: `url('/res/UI/sanxuanyi.png')`, minHeight: '100px', width: '100%' }}
            >
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center ml-2">
                {getIcon(s.heroType)}
              </div>
              <div className="flex-grow pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-gray-900 font-bold text-lg">{s.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${s.tier === 'ultimate' ? 'bg-yellow-500/20 text-yellow-700' : s.tier === 'advanced' ? 'bg-purple-500/20 text-purple-700' : 'bg-gray-500/20 text-gray-600'}`}>
                    {s.tier === 'ultimate' ? '终极' : s.tier === 'advanced' ? '进阶' : '基础'}
                  </span>
                </div>
                <p className="text-gray-700 text-xs line-clamp-1 font-medium">{s.desc}</p>
              </div>
            </button>
          ))}
          {choices.length === 0 && (
            <div className="text-center text-gray-400 py-4">没有可用的技能。</div>
          )}
        </div>
      </div>
    </div>
  );
}

