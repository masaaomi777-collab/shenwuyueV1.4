import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { SkillSelection } from './SkillSelection';
import { Heart, Coins, Pause, Play, Home, TreeDeciduous, Mountain, Box, Zap, Shield, Star } from 'lucide-react';
import { HeroType, LevelConfig, PlayerState } from '../game/types';
import { Joystick } from './Joystick';

import { assets } from '../game/AssetManager';
import { GRASS_TEXTURE, SAND_TEXTURE, ROAD_TEXTURE } from '../game/textures';
import { spineManager, SpineFortress } from '../game/SpineManager';
import { soundManager } from '../game/SoundManager';
import * as spine from "@esotericsoftware/spine-canvas";

interface GameProps {
  levelConfig: LevelConfig;
  playerState: PlayerState;
  onBack: () => void;
  onGameOver: (result: 'win' | 'lose') => void;
  onPrologueEnd: () => void;
}

export function Game({ levelConfig, playerState, onBack, onGameOver, onPrologueEnd }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const joystickInput = useRef({ dx: 0, dy: 0 });
  const [, setTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPrologue, setIsPrologue] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const spineFortressRef = useRef<SpineFortress | null>(null);
  const skeletonRendererRef = useRef<any>(null);

  useEffect(() => {
    // Play background music
    // Use the correct path relative to public root
    const bgmUrl = `/res/sound/battle.wav`;
    soundManager.playBGM(bgmUrl);
    
    return () => {
      soundManager.stopBGM();
    };
  }, []);

  // Initialize engine once
  if (assetsLoaded && !engineRef.current) {
    engineRef.current = new GameEngine(levelConfig, playerState);
  }

  const drawRef = useRef<(time: number) => void>(() => {});

  useEffect(() => {
    Promise.all([
      assets.loadImages({
        'road': '/NEWRES/road.jpg',
        'background': '/NEWRES/bg.png',
        'car': '/NEWRES/Car.png',
        'hero_1': '/NEWRES/hero1.png',
        'hero_2': '/NEWRES/hero2.png',
        'hero_3': '/NEWRES/hero3.png',
        'hero_4': '/NEWRES/hero4.png',
        'bg_name': '/res/bg_name.png',
        'dec_1': '/res/dec_1.png',
        'dec_2': '/res/dec_2.png',
        'dec_3': '/res/dec_3.png',
        'dec_4': '/res/dec_4.png',
        'grass_texture': GRASS_TEXTURE,
        'sand_texture': SAND_TEXTURE,
        'road_texture': ROAD_TEXTURE,
        // New UI Assets
        'ui_buy': '/res/UI/buy.png',
        'ui_skill': '/res/UI/skill.png',
        'ui_hulu': '/res/UI/hulu.png',
        'ui_erhe': '/res/UI/erhe.png',
        'ui_fire': '/res/UI/fire.png',
        'ui_ice': '/res/UI/ice.png',
        'ui_thunder': '/res/UI/thunder.png',
        'ui_wind': '/res/UI/wind.png',
        'ui_sanxuan': '/res/UI/sanxuan.png',
        'ui_sanxuanyi': '/res/UI/sanxuanyi.png',
        'skill_fire': '/res/UI/skill_fire.png',
        'skill_ice': '/res/UI/skill_ice.png',
        'skill_thunder': '/res/UI/skill_thunder.png',
        'skill_wind': '/res/UI/skill_wind.png',
        // Hero Fire Run
        'hero_fire_run_0': '/res/role/Fire/fire-run/fengguanxiapei_nv-run_0.png',
        'hero_fire_run_1': '/res/role/Fire/fire-run/fengguanxiapei_nv-run_1.png',
        'hero_fire_run_2': '/res/role/Fire/fire-run/fengguanxiapei_nv-run_2.png',
        // Hero Ice Run
        'hero_ice_run_0': '/res/role/Ice/ice-run/guanghanxianzi-run_0.png',
        'hero_ice_run_1': '/res/role/Ice/ice-run/guanghanxianzi-run_1.png',
        'hero_ice_run_2': '/res/role/Ice/ice-run/guanghanxianzi-run_2.png',
        'hero_ice_run_3': '/res/role/Ice/ice-run/guanghanxianzi-run_3.png',
        // Hero Thunder Run
        'hero_thunder_run_0': '/res/role/Thunder/thunder-run/erlangzhenjun-run_0.png',
        'hero_thunder_run_1': '/res/role/Thunder/thunder-run/erlangzhenjun-run_1.png',
        'hero_thunder_run_2': '/res/role/Thunder/thunder-run/erlangzhenjun-run_2.png',
        'hero_thunder_run_3': '/res/role/Thunder/thunder-run/erlangzhenjun-run_3.png',
        // Hero Wind Run
        'hero_wind_run_0': '/res/role/Wind/wind-run/huawuxin-run_00.png',
        'hero_wind_run_1': '/res/role/Wind/wind-run/huawuxin-run_01.png',
        'hero_wind_run_2': '/res/role/Wind/wind-run/huawuxin-run_02.png',
        'hero_wind_run_3': '/res/role/Wind/wind-run/huawuxin-run_03.png',
        'hero_wind_run_4': '/res/role/Wind/wind-run/huawuxin-run_04.png',
        'hero_wind_run_5': '/res/role/Wind/wind-run/huawuxin-run_05.png',
        'hero_wind_run_6': '/res/role/Wind/wind-run/huawuxin-run_06.png',
        'hero_wind_run_7': '/res/role/Wind/wind-run/huawuxin-run_07.png',
        'hero_wind_run_8': '/res/role/Wind/wind-run/huawuxin-run_08.png',
        'hero_wind_run_9': '/res/role/Wind/wind-run/huawuxin-run_09.png',
        
        'monster_1': '/res/role/monster_1.png',
        'monster_2': '/res/role/monster_2.png',
        'boss_0': '/res/role/boss_0.png',
        'boss_1': '/res/role/boss_1.png',
        // M001 Appear
        'M001_appear_0': '/res/role/M001/Boss_long-appear/Boss_long-appear_00.png',
        'M001_appear_1': '/res/role/M001/Boss_long-appear/Boss_long-appear_01.png',
        'M001_appear_2': '/res/role/M001/Boss_long-appear/Boss_long-appear_02.png',
        'M001_appear_3': '/res/role/M001/Boss_long-appear/Boss_long-appear_03.png',
        'M001_appear_4': '/res/role/M001/Boss_long-appear/Boss_long-appear_04.png',
        'M001_appear_5': '/res/role/M001/Boss_long-appear/Boss_long-appear_05.png',
        'M001_appear_6': '/res/role/M001/Boss_long-appear/Boss_long-appear_06.png',
        'M001_appear_7': '/res/role/M001/Boss_long-appear/Boss_long-appear_07.png',
        'M001_appear_8': '/res/role/M001/Boss_long-appear/Boss_long-appear_08.png',
        'M001_appear_9': '/res/role/M001/Boss_long-appear/Boss_long-appear_09.png',
        'M001_appear_10': '/res/role/M001/Boss_long-appear/Boss_long-appear_10.png',
        'M001_appear_11': '/res/role/M001/Boss_long-appear/Boss_long-appear_11.png',
        // M001 Idle
        'M001_idle_0': '/res/role/M001/Boss_long-idle/Boss_long-idle_00.png',
        'M001_idle_1': '/res/role/M001/Boss_long-idle/Boss_long-idle_01.png',
        'M001_idle_2': '/res/role/M001/Boss_long-idle/Boss_long-idle_02.png',
        'M001_idle_3': '/res/role/M001/Boss_long-idle/Boss_long-idle_03.png',
        'M001_idle_4': '/res/role/M001/Boss_long-idle/Boss_long-idle_04.png',
        'M001_idle_5': '/res/role/M001/Boss_long-idle/Boss_long-idle_05.png',
        'M001_idle_6': '/res/role/M001/Boss_long-idle/Boss_long-idle_06.png',
        'M001_idle_7': '/res/role/M001/Boss_long-idle/Boss_long-idle_07.png',
        'M001_idle_8': '/res/role/M001/Boss_long-idle/Boss_long-idle_08.png',
        'M001_idle_9': '/res/role/M001/Boss_long-idle/Boss_long-idle_09.png',
        'M001_idle_10': '/res/role/M001/Boss_long-idle/Boss_long-idle_10.png',
        'M001_idle_11': '/res/role/M001/Boss_long-idle/Boss_long-idle_11.png',
        'M001_idle_12': '/res/role/M001/Boss_long-idle/Boss_long-idle_12.png',
        'M001_idle_13': '/res/role/M001/Boss_long-idle/Boss_long-idle_13.png',
        // M001 Skill
        'M001_skill_0': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_00.png',
        'M001_skill_1': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_01.png',
        'M001_skill_2': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_02.png',
        'M001_skill_3': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_03.png',
        'M001_skill_4': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_04.png',
        'M001_skill_5': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_05.png',
        'M001_skill_6': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_06.png',
        'M001_skill_7': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_07.png',
        'M001_skill_8': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_08.png',
        'M001_skill_9': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_09.png',
        'M001_skill_10': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_10.png',
        'M001_skill_11': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_11.png',
        'M001_skill_12': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_12.png',
        'M001_skill_13': '/res/role/M001/Boss_long-skill1/Boss_long-skill1_13.png',
        
        // M002 Run
        'M002_run_0': '/res/role/M002/shanzei-run_0.png',
        'M002_run_1': '/res/role/M002/shanzei-run_1.png',
        'M002_run_2': '/res/role/M002/shanzei-run_2.png',
        'M002_run_3': '/res/role/M002/shanzei-run_3.png',
        'M002_run_4': '/res/role/M002/shanzei-run_4.png',
        // M002 Death
        'M002_death_0': '/res/role/M002/shanzei-death_0.png',
        'M002_death_1': '/res/role/M002/shanzei-death_1.png',
        'M002_death_2': '/res/role/M002/shanzei-death_2.png',
        'M002_death_3': '/res/role/M002/shanzei-death_3.png',
        'M002_death_4': '/res/role/M002/shanzei-death_4.png',
        // M002 Idle
        'M002_idle_0': '/res/role/M002/shanzei-idle_0.png',
        // C001 Run
        'C001_run_0': '/res/role/C001/run_1.png',
        'C001_run_1': '/res/role/C001/run_2.png',
      }),
      spineManager.load()
    ]).then(() => {
      console.log('Assets loaded successfully');
      spineFortressRef.current = spineManager.createFortress();
      setAssetsLoaded(true);
    }).catch(err => {
      console.error('Failed to load assets:', err);
      setLoadError(err.message || String(err));
      // 即使失败也尝试进入游戏，避免卡死
      setAssetsLoaded(true);
    });
  }, []);

  // Initialize SkeletonRenderer when canvas is available
  useEffect(() => {
    if (assetsLoaded && canvasRef.current && !skeletonRendererRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        try {
          // Use the imported spine object to ensure correct class access
          skeletonRendererRef.current = new (spine as any).SkeletonRenderer(ctx);
          skeletonRendererRef.current.triangleRendering = true;
          console.log('SkeletonRenderer initialized successfully');
        } catch (e) {
          console.error('Failed to initialize SkeletonRenderer:', e);
        }
      }
    }
  }, [assetsLoaded]);

  const decorations = React.useMemo(() => [], []);

  useEffect(() => {
    if (!assetsLoaded || !engineRef.current) return;
    const engine = engineRef.current!;
    engine.onSyncUI = () => {
      setTick(t => t + 1);
      setIsPrologue(engine.isPrologue);
    };
    engine.onSkillSelection = () => setTick(t => t + 1);
    engine.onGameOver = (result) => {
      onGameOver(result);
    };
    engine.onPrologueEnd = () => {
      onPrologueEnd();
      setIsPrologue(false);
    };

    let reqId: number;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      
      if (engine.isPrologue) {
        engine.movePlayer(joystickInput.current.dx, joystickInput.current.dy, dt);
      }
      engine.update(time);

      // Update Spine animation
      if (spineFortressRef.current) {
        let animName = 'stand';
        let loop = true;

        if (engine.nodeState === 'stopped_at_node') {
          if (engine.fortressAttacked) {
            animName = 'atked';
            loop = false;
            engine.fortressAttacked = false;
          } else {
            animName = 'stand';
          }
        } else {
          const isSlowed = engine.fortress.speed < engine.fortress.baseSpeed;
          animName = isSlowed ? 'run' : 'speed_run';
        }

        spineFortressRef.current.setAnimation(animName, loop);
        spineFortressRef.current.update(dt);
      }

      if (drawRef.current) drawRef.current(time);
      reqId = requestAnimationFrame(loop);
    };
    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, [onGameOver, onPrologueEnd, assetsLoaded]);

  const getElementColor = (type: HeroType) => {
    switch (type) {
      case 'flame': return '#ef4444';
      case 'ice': return '#60a5fa';
      case 'lightning': return '#facc15';
      case 'wind': return '#2dd4bf';
      case 'rock': return '#b45309';
      case 'shadow': return '#9333ea';
      default: return '#9ca3af';
    }
  };

  const draw = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const engine = engineRef.current;

    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    const width = canvas.width;
    const height = canvas.height;

    // 3D Projection Setup
    const horizon = height * 0.45;
    const vanishingPointX = width / 2;
    const camHeight = 150;
    const focalLength = 600;

    ctx.clearRect(0, 0, width, height);
    
    // 0. Draw Background (Static or slowly scrolling)
    const bgImg = assets.get('background');
    if (bgImg) {
      // Scale background to fill the top part of the screen (horizon)
      const bgH = horizon;
      const bgW = width;
      ctx.drawImage(bgImg, 0, 0, bgW, bgH);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    // Fill ground area below horizon to avoid black gaps
    ctx.fillStyle = '#1e293b'; // Dark ground color
    ctx.fillRect(0, horizon, width, height - horizon);

    const project = (x: number, y: number, z: number) => {
      // Relative to camera focus (fortress or player)
      const focus = (engine.isPrologue && engine.player) ? engine.player : engine.fortress;
      const relX = x - focus.x;
      const relY = y - focus.y;

      // Rotate by focus rotation so "forward" is Z
      const rot = focus.rotation;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      
      // localZ is distance along the forward vector
      // localX is distance along the right vector
      const localZ = relX * cosR + relY * sinR;
      const localX = relX * sinR - relY * cosR;

      // Perspective projection
      const zOffset = 200; 
      const pZ = localZ + zOffset;
      
      if (pZ <= 50) return null; // Behind camera or too close

      const scale = focalLength / pZ;
      const screenX = vanishingPointX + localX * scale;
      const screenY = horizon + (camHeight - z) * scale;
      
      return { x: screenX, y: screenY, scale: scale, pZ: pZ };
    };

    // 1. Draw Road (Projected Path)
    const roadImg = assets.get('road');
    if (roadImg) {
      const roadWidth = 1200; // Further enlarged to fill screen width
      const waypoints = levelConfig.waypoints;
      
      // Find current segment
      let currentIdx = engine.fortress.targetWpIdx;
      if (currentIdx >= waypoints.length) currentIdx = waypoints.length - 1;

      // Draw from slightly behind the car to future waypoints to ensure no gap at bottom
      const focus = (engine.isPrologue && engine.player) ? engine.player : engine.fortress;
      const backDist = 100;
      const backX = focus.x - Math.cos(focus.rotation) * backDist;
      const backY = focus.y - Math.sin(focus.rotation) * backDist;
      
      let lastP = project(backX, backY, 0);
      
      // Draw more segments ahead for "infinite" feel
      for (let i = currentIdx; i < Math.min(currentIdx + 20, waypoints.length); i++) {
        const wp = waypoints[i];
        const nextP = project(wp.x, wp.y, 0);
        
        if (lastP && nextP) {
          const w1 = (roadWidth / 2) * lastP.scale;
          const w2 = (roadWidth / 2) * nextP.scale;

          ctx.beginPath();
          ctx.moveTo(lastP.x - w1, lastP.y);
          ctx.lineTo(lastP.x + w1, lastP.y);
          ctx.lineTo(nextP.x + w2, nextP.y);
          ctx.lineTo(nextP.x - w2, nextP.y);
          ctx.closePath();
          
          ctx.fillStyle = (i % 2 === 0) ? '#334155' : '#1e293b';
          ctx.fill();
          
          // Draw road texture with scrolling effect
          ctx.save();
          ctx.clip();
          const texH = 400;
          const scrollOffset = (engine.distanceTraveled % texH);
          ctx.globalAlpha = 0.4;
          // Draw multiple times to cover the segment if needed, or just stretch
          ctx.drawImage(roadImg, Math.min(lastP.x - w1, nextP.x - w2), nextP.y - scrollOffset, Math.max(w1, w2) * 2, (lastP.y - nextP.y) + texH);
          ctx.restore();
        }
        lastP = nextP;
      }
    }

    // 2. Draw Objects (Monsters, Projectiles, etc.)
    // Sort by pZ descending to draw far objects first
    const drawList: any[] = [];

    // Add monsters
    engine.monsters.forEach(m => {
      const p = project(m.x, m.y, 0);
      if (p) drawList.push({ type: 'monster', data: m, ...p });
    });

    // Add projectiles
    engine.projectiles.forEach(proj => {
      const p = project(proj.x, proj.y, 20);
      if (p) drawList.push({ type: 'projectile', data: proj, ...p });
    });

    // Add area effects
    engine.areaEffects.forEach(ae => {
      const p = project(ae.x, ae.y, 0);
      if (p) drawList.push({ type: 'area_effect', data: ae, ...p });
    });

    // Add heroes
    engine.heroes.forEach(h => {
      const p = project(h.x, h.y, 0);
      if (p) drawList.push({ type: 'hero', data: h, ...p });
    });

    // Sort by depth
    drawList.sort((a, b) => b.pZ - a.pZ);

    // Render draw list
    drawList.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(item.scale, item.scale);

      if (item.type === 'monster') {
        const m = item.data;
        const isBoss = m.monsterType === 'M001';
        const img = m.currentAnim && m.frameIndex !== undefined ? assets.get(`${m.monsterType}_${m.currentAnim}_${m.frameIndex}`) : null;
        
        ctx.globalAlpha = m.alpha !== undefined ? m.alpha : 1;
        if (img) {
          const scale = m.scale || (m.monsterType === 'M002' ? 0.5 : 1);
          if (m.flipX) ctx.scale(-1, 1);
          ctx.drawImage(img, -img.width * scale / 2, -img.height * scale, img.width * scale, img.height * scale);
        } else {
          ctx.fillStyle = isBoss ? '#991b1b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -20, m.radius * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // HP bar
        if (!m.isDead) {
          ctx.fillStyle = '#000';
          ctx.fillRect(-20, -100, 40, 4);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-20, -100, 40 * (m.hp / m.maxHp), 4);
        }
      } else if (item.type === 'hero') {
        const h = item.data;
        const typeIdx = engine.activeElements.indexOf(h.heroType);
        const img = assets.get(`hero_${(typeIdx % 4) + 1}`);
        if (img) {
          const hW = 60; // Shrunk hero size
          const hH = img.height * (hW / img.width);
          ctx.drawImage(img, -hW / 2, -hH, hW, hH);
        } else {
          ctx.fillStyle = getElementColor(h.heroType);
          ctx.beginPath();
          ctx.arc(0, -15, 15, 0, Math.PI * 2);
          ctx.fill();
        }
        // Hero HP bar
        ctx.fillStyle = '#000';
        ctx.fillRect(-12, -60, 24, 2);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-12, -60, 24 * (h.hp / h.maxHp), 2);
      } else if (item.type === 'projectile') {
        const p = item.data;
        ctx.fillStyle = getElementColor(p.heroType);
        ctx.beginPath();
        ctx.arc(0, 0, p.isGiantRock ? 12 : 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'area_effect') {
        const ae = item.data;
        ctx.fillStyle = getElementColor(ae.heroType) + '40';
        ctx.beginPath();
        ctx.ellipse(0, 0, ae.radius, ae.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 3. Draw Fortress (Car) at the bottom
    if (!engine.isPrologue) {
      const carImg = assets.get('car');
      if (carImg) {
        const carW = width * 1.5; // Scaled up
        const carH = carImg.height * (carW / carImg.width);
        // Draw car at the bottom, showing the front part
        ctx.drawImage(carImg, (width - carW) / 2, height - carH * 0.6, carW, carH);
      } else {
        // Fallback car
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(width * 0.1, height - 100, width * 0.8, 100);
      }
    } else if (engine.player) {
      // In prologue, the player is drawn as a character at the bottom center
      const playerImg = assets.get('hero_1'); // Use hero_1 as player in prologue
      if (playerImg) {
        const hW = 120;
        const hH = playerImg.height * (hW / playerImg.width);
        ctx.drawImage(playerImg, width / 2 - hW / 2, height - hH - 20, hW, hH);
      } else {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(width / 2, height - 50, 30, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const engine = engineRef.current!;

  const togglePause = () => {
    engine.isPaused = !engine.isPaused;
    setIsPaused(engine.isPaused);
  };

  if (!assetsLoaded) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-blue-400 animate-pulse font-bold tracking-widest text-xl">资源加载中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-900 text-white select-none">
      {loadError && (
        <div className="absolute top-16 left-4 right-4 bg-red-500/80 text-white p-2 text-xs rounded z-50">
          Load Error: {loadError}
        </div>
      )}
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-1 text-yellow-400 font-bold">
            <img src="/res/UI/icon_coin.png" alt="Coins" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" /> {engine.coins}
          </div>
          <button onClick={togglePause} className="p-2 bg-gray-800/50 rounded-lg border border-gray-700">
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
        <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600 relative pointer-events-auto">
           <div className="h-full bg-blue-500 transition-all" style={{ width: `${(engine.energy / engine.maxEnergy) * 100}%` }} />
           <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
             {engine.energy} / {engine.maxEnergy}
           </div>
        </div>
      </div>

      {/* Bottom UI */}
      <div className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${isPrologue ? 'h-48' : 'h-auto p-4 pb-12 flex flex-col items-center gap-4'} z-10`}>
        {isPrologue ? (
          <div className="w-full h-full flex items-center justify-between px-8">
            <div className="flex flex-col gap-2">
               <button 
                onClick={() => engine.usePlayerSkill()}
                className={`w-16 h-16 flex items-center justify-center relative active:scale-95 transition-transform ${engine.playerSkillCd <= 0 ? 'opacity-100' : 'opacity-50 grayscale'}`}
              >
                <img src="/res/UI/skill.png" className="absolute inset-0 w-full h-full object-contain" referrerPolicy="no-referrer" />
                <img src="/res/UI/hulu.png" className="relative w-12 h-12 object-contain z-10" referrerPolicy="no-referrer" />
                {engine.playerSkillCd > 0 && <span className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl z-20 drop-shadow-md">{Math.ceil(engine.playerSkillCd)}</span>}
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              {/* Fortress Health Bar (Prologue) */}
              <div className="w-48 h-3 bg-black/60 rounded-full border border-white/10 overflow-hidden relative shadow-lg">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-green-500 transition-all duration-500" 
                  style={{ width: `${(engine.fortress.hp / engine.fortress.maxHp) * 100}%` }} 
                />
              </div>
              <div className="flex flex-col items-center gap-2 bg-black/40 p-3 rounded-2xl border border-white/10">
                <div className="flex gap-4 text-sm font-bold">
                  <div className="flex items-center gap-1 text-green-400">
                    <TreeDeciduous size={16} /> {engine.prologueMaterials.wood}/3
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Mountain size={16} /> {engine.prologueMaterials.stone}/3
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Box size={16} /> {engine.prologueMaterials.steel}/3
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-tighter">收集材料修复堡垒</div>
              </div>
            </div>

            <Joystick onMove={(dx, dy) => { joystickInput.current = { dx, dy }; }} />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-2 px-2 pb-2">
            <div className="flex items-center justify-center gap-4 w-full">
              {/* Skill Button */}
              <button 
                onClick={() => engine.usePlayerSkill()}
                className={`w-14 h-14 flex-shrink-0 flex items-center justify-center relative active:scale-95 transition-transform ${engine.playerSkillCd <= 0 ? 'opacity-100' : 'opacity-50 grayscale'}`}
              >
                <img src="/res/UI/skill.png" className="absolute inset-0 w-full h-full object-contain" referrerPolicy="no-referrer" />
                <img src="/res/UI/hulu.png" className="relative w-10 h-10 object-contain z-10" referrerPolicy="no-referrer" />
                {engine.playerSkillCd > 0 && <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg z-20 drop-shadow-md">{Math.ceil(engine.playerSkillCd)}</span>}
              </button>

              {/* Buy Button */}
              <button
                onClick={() => engine.spinSlotMachine()}
                disabled={engine.isSpinning || engine.coins < engine.summonCost}
                className={`w-16 h-16 flex-shrink-0 font-bold flex flex-col items-center justify-center relative active:scale-95 transition-transform ${engine.coins >= engine.summonCost && !engine.isSpinning ? 'opacity-100' : 'opacity-50 grayscale'}`}
              >
                <img src="/res/UI/buy.png" className="absolute inset-0 w-full h-full object-contain" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 flex items-center justify-center z-10">
                   <div className="flex flex-col items-center">
                     <img src="/res/UI/icon_coin.png" alt="Summon" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                     <span className="text-[12px] text-yellow-400 font-black drop-shadow-md -mt-1">{engine.summonCost}</span>
                   </div>
                </div>
              </button>

              {/* Slot Machine Display (Right of Buy) */}
              <div className="relative w-40 h-24 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-2 border-yellow-500 shadow-lg flex flex-col items-center p-1 overflow-hidden">
                <div className="relative w-full h-full bg-black/40 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
                  {engine.isSpinning ? (
                    <div className="flex flex-col gap-1 animate-bounce">
                      <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
                      <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse delay-75" />
                    </div>
                  ) : engine.slotResult ? (
                    <div className="flex flex-col items-center gap-1 animate-in zoom-in duration-300">
                      {engine.slotResult.type === 'hero' ? (
                        <div className="flex items-center gap-1">
                          <img src={`/NEWRES/hero${(engine.activeElements.indexOf(engine.slotResult.value) % 4) + 1}.png`} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                          <span className="text-white font-bold text-[8px] uppercase">{engine.slotResult.value}</span>
                        </div>
                      ) : engine.slotResult.type === 'upgrade' ? (
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400">
                            {engine.slotResult.value === 'fortress' ? <Shield size={16} className="text-blue-400" /> : <Star size={16} className="text-yellow-400" />}
                          </div>
                          <span className="text-blue-400 font-bold text-[8px] uppercase">
                            {engine.slotResult.value === 'fortress' ? '堡垒强化' : '英雄升级'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Coins size={16} className="text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-xs">+{engine.slotResult.value}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => { engine.slotResult = null; setTick(t => t+1); }}
                        className="px-3 py-0.5 bg-yellow-500 text-black font-black text-[8px] rounded-full active:scale-95"
                      >
                        确定
                      </button>
                    </div>
                  ) : (
                    <span className="text-yellow-400 font-black text-[10px] tracking-widest">幸运转盘</span>
                  )}
                </div>
              </div>
            </div>

            {/* Fortress Health Bar at the very bottom */}
            <div className="w-full max-w-[400px] h-5 bg-black/60 rounded-full border border-white/20 overflow-hidden relative shadow-2xl">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 transition-all duration-500 ease-out" 
                style={{ width: `${(engine.fortress.hp / engine.fortress.maxHp) * 100}%` }} 
              />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] uppercase tracking-[0.1em]">
                堡垒生命: {Math.ceil(engine.fortress.hp)} / {engine.fortress.maxHp}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slot Machine Overlay removed */}

      {/* Modals */}
      {engine.isSkillSelection && (
        <SkillSelection choices={engine.skillChoices} onSelect={(id) => engine.selectSkill(id)} />
      )}
      
      {isPaused && !engine.isSkillSelection && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 flex flex-col gap-6 items-center min-w-[280px]">
            <h2 className="text-3xl font-black text-blue-400 tracking-widest">暂停中</h2>
            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={togglePause}
                className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <Play fill="currentColor" /> 继续游戏
              </button>
              <button 
                onClick={onBack}
                className="w-full py-4 bg-gray-700 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95"
              >
                <Home /> 返回主页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

