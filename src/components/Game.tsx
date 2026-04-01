import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { MergeGrid } from './MergeGrid';
import { SkillSelection } from './SkillSelection';
import { Heart, Coins, Pause, Play, Home, TreeDeciduous, Mountain, Box } from 'lucide-react';
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
        'road': '/res/road.png?v=3.0',
        'background': '/res/background.png?v=3.0',
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
        'skill_wind': '/res/UI/skill_sind.png',
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

    ctx.clearRect(0, 0, width, height);
    
    // Fallback background color
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    ctx.save();
    let camX: number, camY: number;
    if (engine.isPrologue) {
      camX = width / 2 - 300;
      camY = height / 2 - 400;
    } else {
      camX = width / 2 - engine.fortress.x;
      camY = height / 2 - engine.fortress.y; // 放置在屏幕正中间
    }
    ctx.translate(camX, camY);

    // 0. Draw Background
    const levelBg = levelConfig.backgroundAsset ? assets.get(levelConfig.backgroundAsset) : null;
    const grassImg = assets.get('grass_texture');
    const sandImg = assets.get('sand_texture');
    const roadImg = assets.get('road');
    const roadEdgeImg = assets.get('roadedge');

    if (levelBg) {
      const pattern = ctx.createPattern(levelBg, 'repeat');
      if (pattern) {
        const matrix = new DOMMatrix();
        matrix.a = 0.5; // Adjust scale as needed
        matrix.d = 0.5;
        pattern.setTransform(matrix);
        ctx.fillStyle = pattern;
        ctx.fillRect(-camX, -camY, width, height);
      }
    } else if (grassImg) {
      const pattern = ctx.createPattern(grassImg, 'repeat');
      if (pattern) {
        const matrix = new DOMMatrix();
        matrix.a = 0.5;
        matrix.d = 0.5;
        pattern.setTransform(matrix);
        ctx.fillStyle = pattern;
        ctx.fillRect(-camX, -camY, width, height);
      }
    } else {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-camX, -camY, width, height);
    }

    // 1. Draw Road Path
    if (roadImg) {
      const roadScale = 0.66;
      const roadWidth = roadImg.width * roadScale;

      levelConfig.waypoints.forEach((wp, i) => {
        if (i === 0) return;
        const prevWp = levelConfig.waypoints[i - 1];

        const dx = wp.x - prevWp.x;
        const dy = wp.y - prevWp.y;
        const realLen = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(prevWp.x, prevWp.y);
        ctx.rotate(angle);

        // Draw Tiled Road Segment - Rotated 90 deg CW
        const scaledTileLen = roadImg.height * roadScale;
        const startX = -roadWidth / 2;
        const baseLen = realLen + roadWidth;
        const numTiles = Math.ceil(baseLen / scaledTileLen);

        for (let x = 0; x < numTiles; x++) {
          ctx.save();
          ctx.translate(startX + x * scaledTileLen + scaledTileLen / 2, 0);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(
            roadImg,
            -roadImg.width * roadScale / 2, -roadImg.height * roadScale / 2,
            roadImg.width * roadScale, roadImg.height * roadScale
          );
          ctx.restore();
        }

        ctx.restore();
      });
    }

    // 1.5 Draw Decorations
    engine.decorations.forEach(dec => {
      const img = assets.get(dec.type);
      if (img) {
        ctx.save();
        ctx.translate(dec.x, dec.y);
        ctx.rotate(dec.rotation);
        const dw = img.width * dec.scale;
        const dh = img.height * dec.scale;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
    });

    // 2. Draw waypoints (only if not prologue)
    if (!engine.isPrologue) {
      // Draw road path dots (optional, can be removed if roadImg is enough)
      levelConfig.waypoints.forEach(wp => {
        if (wp.type !== 'normal') {
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      });
    }

    // Draw decorations (Removed)

    // Draw Resource Nodes (Prologue)
    engine.resourceNodes.forEach(rn => {
      ctx.beginPath();
      if (rn.type === 'wood') ctx.fillStyle = '#10b981';
      else if (rn.type === 'stone') ctx.fillStyle = '#78350f';
      else if (rn.type === 'steel') ctx.fillStyle = '#94a3b8';
      ctx.arc(rn.x, rn.y, rn.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // HP bar
      ctx.fillStyle = '#000';
      ctx.fillRect(rn.x - 20, rn.y - rn.radius - 10, 40, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(rn.x - 20, rn.y - rn.radius - 10, 40 * (rn.hp / rn.maxHp), 4);
    });

    // Draw Area Effects
    engine.areaEffects.forEach(ae => {
      ctx.fillStyle = getElementColor(ae.heroType) + '40';
      ctx.beginPath();
      ctx.arc(ae.x, ae.y, ae.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw fortress
    ctx.save();
    ctx.translate(engine.fortress.x, engine.fortress.y);
    
    if (engine.fortress.currentAnim && engine.fortress.frameIndex !== undefined) {
      const img = assets.get(`C001_${engine.fortress.currentAnim}_${engine.fortress.frameIndex}`);
      ctx.rotate(engine.fortress.rotation + Math.PI / 2);
      if (img) {
        ctx.drawImage(img, -80, -100, 160, 200);
      } else {
        // Fallback to rect
        ctx.fillStyle = engine.isPrologue ? '#4b5563' : '#3b82f6';
        ctx.fillRect(-40, -50, 80, 100);
      }
    } else {
      ctx.rotate(engine.fortress.rotation + Math.PI / 2);
      ctx.fillStyle = engine.isPrologue ? '#4b5563' : '#3b82f6';
      ctx.fillRect(-40, -50, 80, 100);
    }
    
    ctx.restore();

    // Draw Player (Prologue)
    if (engine.player) {
      const playerImg = assets.get('hero_flame');
      const drawRadius = engine.player.radius * 4;
      if (playerImg) {
        ctx.drawImage(playerImg, engine.player.x - drawRadius, engine.player.y - drawRadius, drawRadius * 2, drawRadius * 2);
      } else {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(engine.player.x, engine.player.y, drawRadius, 0, Math.PI * 2);
        ctx.fill();
        // Direction indicator
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(engine.player.x, engine.player.y - drawRadius * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw flying materials
    engine.flyingMaterials.forEach(fm => {
      if (fm.type === 'wood') ctx.fillStyle = '#10b981';
      else if (fm.type === 'stone') ctx.fillStyle = '#78350f';
      else if (fm.type === 'steel') ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(fm.x, fm.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw monsters
    engine.monsters.forEach(m => {
      const isBoss = m.monsterType === 'M001';
      const drawRadius = m.radius * 4;
      
      if (m.currentAnim && m.frameIndex !== undefined) {
        const img = assets.get(`${m.monsterType}_${m.currentAnim}_${m.frameIndex}`);
        if (img) {
          ctx.save();
          ctx.globalAlpha = m.alpha !== undefined ? m.alpha : 1;
          ctx.translate(m.x, m.y);
          if (m.flipX) ctx.scale(-1, 1);
          
          // M002 scaled down by 1/2, M001 also scaled if specified
          const scale = m.scale || (m.monsterType === 'M002' ? 0.5 : 1);
          ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
          ctx.restore();
        } else {
          // Fallback
          ctx.save();
          ctx.globalAlpha = m.alpha !== undefined ? m.alpha : 1;
          ctx.fillStyle = isBoss ? '#991b1b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(m.x, m.y, drawRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (m.spine && skeletonRendererRef.current) {
        const rotation = 0;
        ctx.save();
        ctx.globalAlpha = m.alpha !== undefined ? m.alpha : 1;
        m.spine.render(ctx, skeletonRendererRef.current, m.x, m.y, rotation, m.flipX);
        ctx.restore();
      } else {
        let img = null;
        if (isBoss) {
          img = m.isAttacking ? assets.get('boss_1') : assets.get('boss_0');
        } else {
          const monsterIdx = (parseInt(m.id.slice(-1)) || 0) % 2 + 1;
          img = assets.get(`monster_${monsterIdx}`);
        }

        if (img) {
          ctx.save();
          ctx.globalAlpha = m.alpha !== undefined ? m.alpha : 1;
          ctx.drawImage(img, m.x - img.width / 2, m.y - img.height / 2, img.width, img.height);
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = m.alpha !== undefined ? m.alpha : 1;
          ctx.fillStyle = isBoss ? '#991b1b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(m.x, m.y, drawRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      
      if (!m.isDead) {
        ctx.fillStyle = '#000';
        ctx.fillRect(m.x - 10, m.y - drawRadius - 8, 20, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(m.x - 10, m.y - drawRadius - 8, 20 * (m.hp / m.maxHp), 4);
      }
    });

    // Draw heroes
    engine.heroes.forEach(h => {
      const drawRadius = h.radius * 4;
      
      if (h.spine && skeletonRendererRef.current) {
        h.spine.render(ctx, skeletonRendererRef.current, h.x, h.y, 0, false);
      } else {
        const typeMap: Record<string, string> = {
          'flame': 'fire',
          'ice': 'ice',
          'lightning': 'thunder',
          'wind': 'wind'
        };
        const assetPrefix = typeMap[h.heroType] || h.heroType;
        const img = assets.get(`hero_${assetPrefix}_run_${h.frameIndex || 0}`);
        if (img) {
          ctx.drawImage(img, h.x - drawRadius, h.y - drawRadius, drawRadius * 2, drawRadius * 2);
        } else {
          // Try fallback to static hero image if sequence not found
          const staticImg = assets.get(`hero_${assetPrefix}`);
          if (staticImg) {
            ctx.drawImage(staticImg, h.x - drawRadius, h.y - drawRadius, drawRadius * 2, drawRadius * 2);
          } else {
            ctx.fillStyle = getElementColor(h.heroType);
            ctx.beginPath();
            ctx.arc(h.x, h.y, drawRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });

    // Draw projectiles
    engine.projectiles.forEach(p => {
      ctx.fillStyle = getElementColor(p.heroType);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isGiantRock ? 12 : 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw effects
    engine.effects.forEach(e => {
      const img = assets.get(`${e.assetPrefix}${e.frameIndex}`);
      if (img) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);
        const w = img.width * e.scale;
        const h = img.height * e.scale;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    });

    ctx.restore();
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
      <div className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${isPrologue ? 'h-48' : 'h-auto p-4 pb-8 flex flex-col gap-4'} z-10`}>
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
          <div className="flex items-center justify-between gap-4 px-2">
            <button 
              onClick={() => engine.usePlayerSkill()}
              className={`w-14 h-14 flex-shrink-0 flex items-center justify-center relative active:scale-95 transition-transform ${engine.playerSkillCd <= 0 ? 'opacity-100' : 'opacity-50 grayscale'}`}
            >
              <img src="/res/UI/skill.png" className="absolute inset-0 w-full h-full object-contain" referrerPolicy="no-referrer" />
              <img src="/res/UI/hulu.png" className="relative w-10 h-10 object-contain z-10" referrerPolicy="no-referrer" />
              {engine.playerSkillCd > 0 && <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl z-20 drop-shadow-md">{Math.ceil(engine.playerSkillCd)}</span>}
            </button>

            <div className="flex-grow max-w-[280px] flex flex-col gap-2">
              {/* Fortress Health Bar */}
              <div className="w-full h-5 bg-black/60 rounded-full border-2 border-white/10 overflow-hidden relative shadow-2xl">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 transition-all duration-500 ease-out" 
                  style={{ width: `${(engine.fortress.hp / engine.fortress.maxHp) * 100}%` }} 
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] uppercase tracking-[0.2em]">
                  堡垒生命: {Math.ceil(engine.fortress.hp)} / {engine.fortress.maxHp}
                </div>
              </div>
              <MergeGrid engine={engine} />
            </div>

            <button
              onClick={() => engine.summonHero()}
              className={`w-14 h-14 flex-shrink-0 font-bold flex flex-col items-center justify-center relative active:scale-95 transition-transform ${engine.coins >= engine.summonCost ? 'opacity-100' : 'opacity-50 grayscale'}`}
            >
              <img src="/res/UI/buy.png" className="absolute inset-0 w-full h-full object-contain" referrerPolicy="no-referrer" />
              {/* Icon centered on the background */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <img src="/res/UI/icon_coin.png" alt="Summon" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
              </div>
              {/* Coin count below the background */}
              <div className="absolute top-full left-0 w-full flex justify-center z-20 mt-1">
                <span className="text-[12px] text-yellow-400 font-black drop-shadow-md">{engine.summonCost}</span>
              </div>
            </button>
          </div>
        )}
      </div>

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

