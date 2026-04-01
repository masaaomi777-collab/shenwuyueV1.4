import React from 'react';
import { GameEngine } from '../game/GameEngine';
import { HeroType } from '../game/types';
import { assets } from '../game/AssetManager';

export function MergeGrid({ engine }: { engine: GameEngine }) {
  const [draggedIdx, setDraggedIdx] = React.useState<number | null>(null);
  const [touchPos, setTouchPos] = React.useState<{ x: number, y: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (idx >= engine.unlockedSlotsCount) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', idx.toString());
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      engine.mergeSlots(fromIdx, toIdx);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    if (engine.grid[idx] && idx < engine.unlockedSlotsCount) {
      setDraggedIdx(idx);
      const touch = e.touches[0];
      setTouchPos({ x: touch.clientX, y: touch.clientY });
      // Prevent default to avoid scrolling/zooming during drag
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIdx !== null) {
      const touch = e.touches[0];
      setTouchPos({ x: touch.clientX, y: touch.clientY });
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (draggedIdx === null) return;

    const touch = e.changedTouches[0];
    // Temporarily disable pointer events on the ghost to get the element underneath
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotElement = target?.closest('[data-slot-idx]');
    
    if (slotElement) {
      const toIdx = parseInt(slotElement.getAttribute('data-slot-idx')!);
      if (!isNaN(toIdx) && toIdx !== draggedIdx) {
        engine.mergeSlots(draggedIdx, toIdx);
      }
    }
    setDraggedIdx(null);
    setTouchPos(null);
  };

  const getElementColor = (type: HeroType) => {
    switch (type) {
      case 'flame': return 'bg-red-500';
      case 'ice': return 'bg-blue-400';
      case 'lightning': return 'bg-yellow-400';
      case 'wind': return 'bg-teal-400';
      case 'rock': return 'bg-amber-700';
      case 'shadow': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };

  const getElementLabel = (type: HeroType) => {
    switch (type) {
      case 'flame': return '火';
      case 'ice': return '冰';
      case 'lightning': return '雷';
      case 'wind': return '风';
      case 'rock': return '岩';
      case 'shadow': return '影';
      default: return '无';
    }
  };

  const getHeroImage = (type: HeroType) => {
    switch (type) {
      case 'flame': return '/res/UI/fire.png';
      case 'ice': return '/res/UI/ice.png';
      case 'lightning': return '/res/UI/thunder.png';
      case 'wind': return '/res/UI/wind.png';
      default: return null;
    }
  };

  return (
    <div 
      className="relative pt-10 pb-6 px-6 rounded-xl shadow-2xl bg-contain bg-no-repeat bg-center flex items-center justify-center"
      style={{ backgroundImage: `url('/res/UI/erhe.png')`, minHeight: '180px' }}
    >
      <div className="grid grid-cols-5 gap-3 touch-none relative z-10 w-full max-w-[260px]">
        {engine.grid.map((slot, idx) => {
          const isLocked = idx >= engine.unlockedSlotsCount;
          const heroImg = slot ? getHeroImage(slot.heroType) : null;
          const isFirstRow = idx < 5;

          return (
            <div
              key={idx}
              data-slot-idx={idx}
              draggable={!!slot && !isLocked}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              onTouchStart={(e) => handleTouchStart(e, idx)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`aspect-square rounded-lg flex items-center justify-center relative transition-all
                ${isLocked ? 'opacity-0 pointer-events-none' : slot ? 'cursor-grab active:cursor-grabbing' : ''}
                ${draggedIdx === idx ? 'opacity-50 scale-95' : ''}
                ${isFirstRow ? '-translate-y-4' : ''}
              `}
            >
              {slot && !isLocked && (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  {heroImg ? (
                    <img src={heroImg} alt={slot.heroType} className="w-[160%] h-[160%] max-w-none object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className={`w-full h-full rounded-md flex items-center justify-center ${getElementColor(slot.heroType)}`}>
                      <span className="text-xs font-bold text-white">{getElementLabel(slot.heroType)}</span>
                    </div>
                  )}
                  
                  {/* Star rating overlay */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-[1px] pb-1">
                    {Array(slot.star).fill(0).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-yellow-600" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Touch Drag Ghost */}
      {draggedIdx !== null && touchPos && engine.grid[draggedIdx] && (
        <div 
          className="fixed pointer-events-none z-[100] w-14 h-14 flex flex-col items-center justify-center shadow-2xl scale-110 opacity-90"
          style={{ 
            left: touchPos.x - 28, 
            top: touchPos.y - 28,
            transform: 'translate3d(0,0,0)'
          }}
        >
          {getHeroImage(engine.grid[draggedIdx]!.heroType) ? (
            <img 
              src={getHeroImage(engine.grid[draggedIdx]!.heroType)!} 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full rounded-lg ${getElementColor(engine.grid[draggedIdx]!.heroType)} border-2 border-white/40`} />
          )}
        </div>
      )}
    </div>
  );
}

