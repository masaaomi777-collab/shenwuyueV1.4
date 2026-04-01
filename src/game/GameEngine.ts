import { LEVELS, UNLOCK_THRESHOLDS, SKILL_TREES } from './constants';
import { Monster, SummonedHero, Projectile, GridSlot, HeroType, AreaEffect, SkillNode, Buff, LevelConfig, PlayerState, ResourceNode, PlayerCharacter, MaterialCount, Decoration, Fortress, GameEffect } from './types';
import { spineManager } from './SpineManager';

export interface FlyingMaterial {
  id: string;
  x: number;
  y: number;
  type: 'wood' | 'stone' | 'steel';
  targetX: number;
  targetY: number;
  speed: number;
}

export class GameEngine {
  levelConfig: LevelConfig;
  playerState: PlayerState;
  decorations: Decoration[] = [];

  fortress: Fortress = { 
    id: 'fortress', x: 0, y: 0, hp: 1000, maxHp: 1000, baseSpeed: 50, speed: 50, targetWpIdx: 1, radius: 40, rotation: 0,
    currentAnim: 'run', frameIndex: 0, animTimer: 0
  };
  monsters: Monster[] = [];
  heroes: SummonedHero[] = [];
  projectiles: Projectile[] = [];
  areaEffects: AreaEffect[] = [];
  effects: GameEffect[] = [];
  resourceNodes: ResourceNode[] = [];
  player: PlayerCharacter | null = null;
  flyingMaterials: FlyingMaterial[] = [];
  prologueMaterials: MaterialCount = { wood: 0, stone: 0, steel: 0 };
  isPrologue = false;
  prologueTargetMaterials = 3;

  grid: (GridSlot | null)[] = Array(10).fill(null);
  summonCount = 0;
  coins = 250;
  energy = 0;
  maxEnergy = 5;
  level = 1;

  playerSkillCd = 0;

  isPaused = false;
  isSkillSelection = false;
  skillChoices: SkillNode[] = [];
  unlockedSkills = new Set<string>();
  activeElements: HeroType[] = [];

  // Fortress buffs
  fortressShield = 0;
  fortressShieldMax = 100;
  fortressAtkSpeedBuff = 0;
  fortressDamageReduction = 0;
  fortressDamageReductionTimer = 0;
  fortressAttacked = false;

  nodeState: 'moving' | 'stopped_at_node' = 'moving';
  nodeTimer = 0;

  onSyncUI?: () => void;
  onSkillSelection?: () => void;
  onGameOver?: (result: 'win' | 'lose') => void;
  onPrologueEnd?: () => void;

  lastTime = 0;
  spawnTimer = 0;
  distanceTraveled = 0;
  lastSpawnDist = 0;
  towerTimers = [0, 0, 0, 0];

  constructor(level: LevelConfig, playerState: PlayerState) {
    this.levelConfig = level;
    this.playerState = playerState;
    
    // Use deployed heroes from player state
    this.activeElements = (Object.keys(playerState.heroes) as HeroType[])
      .filter(type => playerState.heroes[type].isDeployed);
    
    // Ensure at least some elements if none deployed (fallback)
    if (this.activeElements.length === 0) {
      this.activeElements = ['flame', 'ice', 'lightning', 'wind'];
    }

    // Adjust fortress HP based on hero levels
    const avgHeroLevel = this.activeElements.reduce((sum, type) => sum + playerState.heroes[type].level, 0) / Math.max(1, this.activeElements.length);
    this.fortress.maxHp = 1000 + avgHeroLevel * 100;
    this.fortress.hp = this.fortress.maxHp;

    if (level.id === 1 && !playerState.prologueCompleted) {
      this.isPrologue = true;
      this.initPrologue();
    }

    // Generate decorations if not provided
    if (level.decorations) {
      this.decorations = level.decorations;
    } else {
      this.generateDecorations();
    }
  }

  generateDecorations() {
    const decTypes = ['dec_1', 'dec_2', 'dec_3', 'dec_4'];
    const count = 40 + Math.floor(Math.random() * 20);
    
    // Find map bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.levelConfig.waypoints.forEach(wp => {
      minX = Math.min(minX, wp.x);
      maxX = Math.max(maxX, wp.x);
      minY = Math.min(minY, wp.y);
      maxY = Math.max(maxY, wp.y);
    });

    // Add margin - reduced to keep them closer to the road
    minX -= 300; maxX += 300;
    minY -= 300; maxY += 300;

    for (let i = 0; i < count; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      
      // Check if too close to road
      let tooClose = false;
      for (let j = 1; j < this.levelConfig.waypoints.length; j++) {
        const p1 = this.levelConfig.waypoints[j-1];
        const p2 = this.levelConfig.waypoints[j];
        const dist = this.pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
        if (dist < 100) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        this.decorations.push({
          x, y,
          type: decTypes[Math.floor(Math.random() * decTypes.length)],
          scale: 0.2 + Math.random() * 0.2,
          rotation: 0 // Fixed rotation as requested
        });
      }
    }
  }

  pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  initPrologue() {
    this.fortress.x = 300;
    this.fortress.y = 400;
    
    this.player = {
      id: 'player',
      x: 300,
      y: 500,
      hp: 100,
      maxHp: 100,
      speed: 150,
      radius: 20,
      attackCooldown: 0.5,
      lastAttackTime: 0
    };

    this.resourceNodes = [];
    const types: ('wood' | 'stone' | 'steel')[] = ['wood', 'stone', 'steel'];
    types.forEach((type, typeIdx) => {
      for (let i = 0; i < 3; i++) {
        const angle = (typeIdx * 3 + i) * (Math.PI * 2 / 9);
        const dist = 150 + Math.random() * 50;
        this.resourceNodes.push({
          id: `${type}_node_${i}`,
          x: 300 + Math.cos(angle) * dist,
          y: 400 + Math.sin(angle) * dist,
          hp: 1,
          maxHp: 1,
          speed: 0,
          radius: 25,
          type
        });
      }
    });
  }

  movePlayer(dx: number, dy: number, dt: number) {
    if (!this.player) return;
    const nextX = this.player.x + dx * this.player.speed * dt;
    const nextY = this.player.y + dy * this.player.speed * dt;
    
    // Fortress collision
    const fdx = nextX - this.fortress.x;
    const fdy = nextY - this.fortress.y;
    const fdist = Math.hypot(fdx, fdy);
    const minFDist = this.fortress.radius + this.player.radius;
    
    if (fdist >= minFDist) {
      this.player.x = nextX;
      this.player.y = nextY;
    } else {
      // Slide around fortress
      const angle = Math.atan2(fdy, fdx);
      this.player.x = this.fortress.x + Math.cos(angle) * minFDist;
      this.player.y = this.fortress.y + Math.sin(angle) * minFDist;
    }
    
    // Constrain to screen
    this.player.x = Math.max(20, Math.min(580, this.player.x));
    this.player.y = Math.max(20, Math.min(780, this.player.y));
  }

  get unlockedSlotsCount() {
    return 10;
  }

  get summonCost() {
    return Math.min(300, 50 + Math.floor(this.summonCount / 2) * 10);
  }

  update(time: number) {
    if (!this.lastTime) this.lastTime = time;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.isPaused || this.isSkillSelection) return;

    if (this.isPrologue) {
      this.updatePrologue(dt);
      if (this.onSyncUI) this.onSyncUI();
      return;
    }

    if (this.fortressDamageReductionTimer > 0) {
      this.fortressDamageReductionTimer -= dt;
      if (this.fortressDamageReductionTimer <= 0) {
        this.fortressDamageReduction = 0;
      }
    }

    this.updatePlayerSkill(dt);
    this.updateFortress(dt);
    this.updateMonsters(dt);
    this.updateCombat(dt);
    this.updateEffects(dt);
    this.spawnMonsters(dt);

    if (this.onSyncUI) this.onSyncUI();
  }

  updatePlayerSkill(dt: number) {
    if (this.playerSkillCd > 0) {
      this.playerSkillCd -= dt;
      if (this.playerSkillCd < 0) this.playerSkillCd = 0;
    }
  }

  updateFortress(dt: number) {
    // Update fortress animation
    if (this.fortress.currentAnim && this.fortress.frameIndex !== undefined && this.fortress.animTimer !== undefined) {
      this.fortress.animTimer += dt;
      const frameRate = 0.2; // 5 FPS for fortress
      if (this.fortress.animTimer >= frameRate) {
        this.fortress.animTimer = 0;
        this.fortress.frameIndex++;
        if (this.fortress.frameIndex >= 2) { // run_1 and run_2
          this.fortress.frameIndex = 0;
        }
      }
    }

    if (this.nodeState === 'stopped_at_node') {
      if (this.monsters.length === 0 && this.nodeTimer > 2) {
        this.nodeState = 'moving';
        this.fortress.targetWpIdx++;
        const wp = this.levelConfig.waypoints[this.fortress.targetWpIdx - 1];
        if (wp && (wp.type === 'elite1' || wp.type === 'elite2')) {
          this.triggerSkillSelection();
        }
      }
      this.nodeTimer += dt;
      return;
    }

    const target = this.levelConfig.waypoints[this.fortress.targetWpIdx];
    if (!target) {
      // Win condition: reached last waypoint
      if (this.onGameOver) this.onGameOver('win');
      this.isPaused = true;
      return;
    }

    const dx = target.x - this.fortress.x;
    const dy = target.y - this.fortress.y;
    const dist = Math.hypot(dx, dy);

    const attackingCount = this.monsters.filter(m => m.isAttacking).length;
    const speedMult = Math.max(0.01, 1 - (attackingCount * 0.2));
    this.fortress.speed = this.fortress.baseSpeed * speedMult;

    if (dist < this.fortress.speed * dt) {
      this.distanceTraveled += dist;
      this.fortress.x = target.x;
      this.fortress.y = target.y;
      this.fortress.rotation = Math.atan2(dy, dx);
      if (target.type.startsWith('elite') || target.type === 'boss') {
        this.nodeState = 'stopped_at_node';
        this.nodeTimer = 0;
        this.spawnNodeMonsters(target.type);
      } else {
        this.fortress.targetWpIdx++;
      }
    } else {
      const moveDist = this.fortress.speed * dt;
      this.distanceTraveled += moveDist;
      this.fortress.rotation = Math.atan2(dy, dx);
      this.fortress.x += (dx / dist) * moveDist;
      this.fortress.y += (dy / dist) * moveDist;
    }
  }

  spawnNodeMonsters(type: string) {
    const count = type === 'boss' ? 50 : 25;
    const hpMult = this.levelConfig.monsterHpMult || 1;
    const speedMult = this.levelConfig.monsterSpeedMult || 1;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 600 + Math.random() * 200; // Spawn outside screen
      const hp = 80 * hpMult;
      const speed = 35 * speedMult;
      const mType = 'M002';
      const monster: Monster = {
        id: Math.random().toString(),
        x: this.fortress.x + Math.cos(angle) * r,
        y: this.fortress.y + Math.sin(angle) * r,
        hp, maxHp: hp, speed, radius: 12,
        damage: 10, attackCooldown: 1, lastAttackTime: 0, isAttacking: false, buffs: [],
        monsterType: mType,
        flipX: Math.random() > 0.5,
        currentAnim: 'run',
        frameIndex: 0,
        animTimer: 0
      };
      this.monsters.push(monster);
    }
    const eliteHp = (type === 'boss' ? 5000 : 1000) * hpMult;
    const eliteSpeed = 0; // M001 stationary
    const mType = 'M001';
    const elite: Monster = {
      id: Math.random().toString(),
      x: this.fortress.x,
      y: this.fortress.y - 300, // Fixed at top of screen, moved down 1/4 from -400
      hp: eliteHp, maxHp: eliteHp,
      speed: eliteSpeed, radius: 40, // Increased radius for boss
      damage: 50, attackCooldown: 2, lastAttackTime: 0, isAttacking: false, buffs: [],
      monsterType: mType,
      flipX: false,
      currentAnim: 'appear',
      frameIndex: 0,
      animTimer: 0,
      scale: 0.33
    };
    this.monsters.push(elite);
  }

  updatePrologue(dt: number) {
    this.updatePlayerSkill(dt);
    
    // Player auto-attack
    if (this.player && this.lastTime - this.player.lastAttackTime > this.player.attackCooldown * 1000) {
      // Find nearest target (monster or resource node)
      let nearestTarget: any = null;
      let minDist = 150; // Attack range

      this.monsters.forEach(m => {
        const d = Math.hypot(m.x - this.player!.x, m.y - this.player!.y);
        if (d < minDist) {
          minDist = d;
          nearestTarget = m;
        }
      });

      this.resourceNodes.forEach(rn => {
        const d = Math.hypot(rn.x - this.player!.x, rn.y - this.player!.y);
        if (d < minDist) {
          minDist = d;
          nearestTarget = rn;
        }
      });

      if (nearestTarget) {
        this.player.lastAttackTime = this.lastTime;
        // Simple projectile
        this.projectiles.push({
          id: Math.random().toString(),
          x: this.player.x,
          y: this.player.y,
          targetId: nearestTarget.id,
          damage: 1,
          speed: 400,
          source: 'hero',
          heroType: 'rock', // Just a visual type
          pierceCount: 0
        });
      }
    }

    // Update projectiles (simplified for prologue)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      let target: any = this.monsters.find(m => m.id === p.targetId) || this.resourceNodes.find(rn => rn.id === p.targetId);
      
      if (!target) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 10) {
        target.hp -= p.damage;
        if (target.hp <= 0 && 'type' in target && (target.type === 'wood' || target.type === 'stone' || target.type === 'steel')) {
          // Drop material only when destroyed
          this.flyingMaterials.push({
            id: Math.random().toString(),
            x: target.x,
            y: target.y,
            type: target.type,
            targetX: this.fortress.x,
            targetY: this.fortress.y,
            speed: 300
          });
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      p.x += (dx / dist) * p.speed * dt;
      p.y += (dy / dist) * p.speed * dt;
    }

    // Update resource nodes
    this.resourceNodes = this.resourceNodes.filter(rn => rn.hp > 0);

    // Update flying materials
    for (let i = this.flyingMaterials.length - 1; i >= 0; i--) {
      const fm = this.flyingMaterials[i];
      const dx = this.fortress.x - fm.x;
      const dy = this.fortress.y - fm.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 10) {
        this.prologueMaterials[fm.type]++;
        this.flyingMaterials.splice(i, 1);
        
        // Check if prologue finished
        if (this.prologueMaterials.wood >= 3 && this.prologueMaterials.stone >= 3 && this.prologueMaterials.steel >= 3) {
          this.endPrologue();
        }
        continue;
      }

      fm.x += (dx / dist) * fm.speed * dt;
      fm.y += (dy / dist) * fm.speed * dt;
    }

    // Update monsters (they don't drop coins)
    this.updateMonsters(dt, false);

    // Spawn monsters (fewer in prologue)
    this.spawnTimer += dt;
    if (this.spawnTimer > 3) {
      this.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 300;
      this.monsters.push({
        id: Math.random().toString(),
        x: this.fortress.x + Math.cos(angle) * dist,
        y: this.fortress.y + Math.sin(angle) * dist,
        hp: 10,
        maxHp: 10,
        speed: 30,
        radius: 15,
        damage: 1,
        attackCooldown: 2,
        lastAttackTime: 0,
        isAttacking: false,
        buffs: [],
        monsterType: 'M001',
        currentAnim: 'run',
        frameIndex: 0,
        animTimer: 0,
        isDead: false,
        flipX: Math.random() > 0.5
      });
    }
  }

  endPrologue() {
    this.isPrologue = false;
    this.player = null;
    this.resourceNodes = [];
    this.flyingMaterials = [];
    this.monsters = []; // Clear prologue monsters
    
    // Reset fortress to start position
    const startWp = this.levelConfig.waypoints[0];
    this.fortress.x = startWp.x;
    this.fortress.y = startWp.y;
    this.fortress.targetWpIdx = 1;
    
    // Mark as completed in player state (caller should handle persistence)
    if (this.onPrologueEnd) this.onPrologueEnd();
  }

  isMonsterOnScreen(m: Monster) {
    // Check if monster is within a reasonable distance from the fortress to be considered "on screen"
    // Since the camera follows the fortress, this is a reliable way to check visibility.
    const dist = Math.hypot(m.x - this.fortress.x, m.y - this.fortress.y);
    return dist < 700; // Visible range approx 700px radius
  }

  updateMonsters(dt: number, dropCoins = true) {
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      
      // Update fade-in alpha
      if (m.alpha !== undefined && m.alpha < 1) {
        m.alpha = Math.min(1, m.alpha + dt * 2); // Fade in over 0.5s
      }

      // Update sequence animation
      if (m.currentAnim && m.frameIndex !== undefined && m.animTimer !== undefined) {
        m.animTimer += dt;
        const frameRate = 0.1; // 10 FPS
        if (m.animTimer >= frameRate) {
          m.animTimer = 0;
          m.frameIndex++;
          
          // Determine max frames based on monster type and animation
          let maxFrames = 1;
          if (m.monsterType === 'M001') {
            if (m.currentAnim === 'appear') maxFrames = 12;
            else if (m.currentAnim === 'idle') maxFrames = 14;
            else if (m.currentAnim === 'skill') maxFrames = 14;
            else if (m.currentAnim === 'run') maxFrames = 6;
            else if (m.currentAnim === 'death') maxFrames = 5;
          } else if (m.monsterType === 'M002') {
            if (m.currentAnim === 'run') maxFrames = 5;
            else if (m.currentAnim === 'death') maxFrames = 5;
            else if (m.currentAnim === 'idle') maxFrames = 1;
          }
          
          if (m.frameIndex >= maxFrames) {
            if (m.currentAnim === 'death') {
              this.monsters.splice(i, 1);
              continue;
            }
            if (m.currentAnim === 'appear') {
              m.currentAnim = 'idle';
              m.frameIndex = 0;
            } else if (m.currentAnim === 'skill') {
              m.currentAnim = 'idle';
              m.frameIndex = 0;
            } else {
              m.frameIndex = 0;
            }
          }
        }
      }

      if (m.isDead) continue;

      // Buffs
      let speedMult = 1;
      let dmgAmp = 1;
      for (let j = m.buffs.length - 1; j >= 0; j--) {
        const b = m.buffs[j];
        b.duration -= dt;
        if (b.duration <= 0) {
          m.buffs.splice(j, 1);
          continue;
        }
        
        // Apply damage (no longer invulnerable off-screen)
        if (b.type === 'burn') m.hp -= (b.value || 5) * dt;
        if (b.type === 'curse') m.hp -= (b.value || 5) * dt;
        
        if (b.type === 'slow') speedMult *= (1 - (b.value || 0.3));
        if (b.type === 'freeze' || b.type === 'stun' || b.type === 'paralyze') speedMult = 0;
        if (b.type === 'mark' || b.type === 'curse') dmgAmp += 0.2;
      }
      
      m.speed = 40 * speedMult * (this.levelConfig?.monsterSpeedMult || 1);

      if (m.hp <= 0) {
        m.isDead = true;
        m.currentAnim = 'death';
        m.frameIndex = 0;
        m.animTimer = 0;
        
        if (dropCoins) {
          this.coins += m.maxHp > 100 ? 50 : 10;
        }
        
        // On-death effects
        if (m.buffs.some(b => b.type === 'burn') && this.unlockedSkills.has('flame_E')) {
          this.areaEffects.push({ id: Math.random().toString(), x: m.x, y: m.y, radius: 40, duration: 3, type: 'burning_ground', damagePerSec: 10, heroType: 'flame' });
        }
        if (m.buffs.some(b => b.type === 'mark')) {
          this.areaEffects.push({ id: Math.random().toString(), x: m.x, y: m.y, radius: 60, duration: 0.5, type: 'burning_ground', damagePerSec: 50, heroType: 'shadow' });
        }
        if (m.buffs.some(b => b.type === 'curse') && this.unlockedSkills.has('shadow_D')) {
          this.monsters.forEach(m2 => {
            if (Math.hypot(m2.x - m.x, m2.y - m.y) < 100) {
              this.applyBuff(m2, { type: 'curse', duration: 3, value: 5 });
            }
          });
        }
        continue;
      }

      // Movement
      const dx = this.fortress.x - m.x;
      const dy = this.fortress.y - m.y;
      const dist = Math.hypot(dx, dy);

      if (m.monsterType === 'M001') {
        // M001 stationary at top, but still attacks when in range
        // Reverted relative positioning as requested
        if (dist <= this.fortress.radius + m.radius + 700) { 
          m.isAttacking = true;
        } else {
          m.isAttacking = false;
        }
        // Ensure M001 speed stays 0 to prevent drifting
        m.speed = 0;
      } else {
        // Catch-up logic: if monster is behind the fortress, speed up
        const dot = Math.cos(this.fortress.rotation) * (m.x - this.fortress.x) + Math.sin(this.fortress.rotation) * (m.y - this.fortress.y);
        if (dot < 0 && !m.isAttacking) {
          // Monster is behind the fortress
          m.speed = Math.max(m.speed, this.fortress.speed + 20);
        }

        if (dist > this.fortress.radius + m.radius) {
          m.x += (dx / dist) * m.speed * dt;
          m.y += (dy / dist) * m.speed * dt;
          m.isAttacking = false;
          m.currentAnim = 'run';
        } else {
          m.isAttacking = true;
          m.currentAnim = 'idle';
        }
      }

      if (m.isAttacking) {
        if (this.lastTime - m.lastAttackTime > m.attackCooldown * 1000) {
          if (m.monsterType === 'M001' && m.currentAnim !== 'appear') {
            m.currentAnim = 'skill';
            m.frameIndex = 0;
            m.animTimer = 0;
          }
          
          let damageTaken = m.damage;
          if (this.fortressDamageReduction > 0) {
            damageTaken *= (1 - this.fortressDamageReduction);
          }
          if (this.fortressShield > 0) {
            if (this.fortressShield >= damageTaken) {
              this.fortressShield -= damageTaken;
              damageTaken = 0;
            } else {
              damageTaken -= this.fortressShield;
              this.fortressShield = 0;
            }
          }
          this.fortress.hp -= damageTaken;
          this.fortressAttacked = true;
          m.lastAttackTime = this.lastTime;
          if (this.fortress.hp <= 0) {
            this.fortress.hp = 0;
            if (this.onGameOver) this.onGameOver('lose');
            this.isPaused = true;
          }
        }
      }
    }
  }

  spawnMonsters(dt: number) {
    if (this.nodeState === 'stopped_at_node') return;
    
    const spawnInterval = 150 * (this.levelConfig.spawnIntervalMult || 1);
    if (this.distanceTraveled - this.lastSpawnDist > spawnInterval) {
      this.lastSpawnDist = this.distanceTraveled;
      
      const waveCount = 4 + Math.floor(Math.random() * 4);
      
      // Check if moving vertically (up or down)
      const rot = this.fortress.rotation;
      const isVertical = Math.abs(Math.cos(rot)) < 0.3; // Close to PI/2 or -PI/2
      
      for (let i = 0; i < waveCount; i++) {
        let angle: number;
        if (isVertical) {
          // Spawn only in front (approx 60 degree cone)
          const cone = Math.PI / 3;
          angle = rot + (Math.random() - 0.5) * cone;
        } else {
          // Normal circular dispersion
          angle = Math.random() * Math.PI * 2;
        }

        // Randomly spawn some monsters on-screen (closer) with fade-in
        const isOnScreenSpawn = Math.random() > 0.6;
        const spawnDist = isOnScreenSpawn ? (200 + Math.random() * 100) : (600 + Math.random() * 200);
        
        const hp = (50 + this.level * 10) * (this.levelConfig.monsterHpMult || 1);
        const speed = (40 + Math.random() * 10) * (this.levelConfig.monsterSpeedMult || 1);
        const mType = 'M002';
        
        this.monsters.push({
          id: Math.random().toString(),
          x: this.fortress.x + Math.cos(angle) * spawnDist,
          y: this.fortress.y + Math.sin(angle) * spawnDist,
          hp, maxHp: hp, speed, radius: 6, // M002 scaled down by 1/2 (from 12 to 6)
          damage: 5 + this.level, attackCooldown: 1, lastAttackTime: 0, isAttacking: false, buffs: [],
          monsterType: mType,
          flipX: Math.random() > 0.5,
          currentAnim: 'run',
          frameIndex: 0,
          animTimer: 0,
          alpha: isOnScreenSpawn ? 0 : 1 // Fade in if spawned on screen
        });
      }
    }
  }

  getBestTargetArea(radius: number): {x: number, y: number} {
    if (this.monsters.length === 0) {
      return { x: this.fortress.x, y: this.fortress.y - 200 };
    }
    let bestPos = { x: this.monsters[0].x, y: this.monsters[0].y };
    let maxCount = -1;
    for (const m of this.monsters) {
      let count = 0;
      for (const other of this.monsters) {
        if (Math.hypot(m.x - other.x, m.y - other.y) <= radius) {
          count++;
        }
      }
      if (count > maxCount) {
        maxCount = count;
        bestPos = { x: m.x, y: m.y };
      }
    }
    return bestPos;
  }

  updateCombat(dt: number) {
    // Update hero animations
    this.heroes.forEach(h => {
      if (h.frameIndex === undefined) h.frameIndex = 0;
      if (h.animTimer === undefined) h.animTimer = 0;
      h.animTimer += dt;
      const frameRate = 0.1;
      if (h.animTimer >= frameRate) {
        h.animTimer = 0;
        h.frameIndex++;
        
        const maxFramesMap: Record<string, number> = {
          'flame': 3,
          'ice': 4,
          'lightning': 4,
          'wind': 10,
          'rock': 1,
          'shadow': 1
        };
        const maxFrames = maxFramesMap[h.heroType] || 1;
        
        if (h.frameIndex >= maxFrames) h.frameIndex = 0;
      }
    });

    // Tower attacks
    for(let i=0; i<4; i++) {
      const el = this.activeElements[i];
      if (!el) continue;
      
      this.towerTimers[i] += dt;
      let atkSpeed = 1;
      if (el === 'flame' && this.unlockedSkills.has('flame_C')) atkSpeed *= 1.3;
      if (el === 'wind' && this.unlockedSkills.has('wind_C')) atkSpeed *= (1 + this.fortressAtkSpeedBuff);
      
      const cooldown = 1 / atkSpeed;
      if (this.towerTimers[i] > cooldown) {
        this.towerTimers[i] = 0;
        
        if (el === 'flame' && this.unlockedSkills.has('flame_G')) {
          // Flamethrower
          this.monsters.forEach(m => {
            const dx = m.x - this.fortress.x;
            const dy = m.y - this.fortress.y;
            if (Math.hypot(dx, dy) < 200 && dy < 0) { // Front fan
              m.hp -= 10;
              this.applyBuff(m, { type: 'burn', duration: 3, value: 5 });
            }
          });
          continue;
        }
        if (el === 'ice' && this.unlockedSkills.has('ice_G')) {
          // Frost storm
          this.areaEffects.push({
            id: Math.random().toString(), x: this.fortress.x, y: this.fortress.y - 100,
            radius: 150, duration: 1, type: 'blizzard', damagePerSec: 20, heroType: 'ice'
          });
          continue;
        }
        if (el === 'lightning' && this.unlockedSkills.has('lightning_G')) {
          this.monsters.forEach(m => {
            if (Math.hypot(m.x - this.fortress.x, m.y - this.fortress.y) < 250) {
              m.hp -= 15;
            }
          });
          continue;
        }

        let target = null;
        let minD = 300; // Fortress attack range (approx screen width)
        for (const m of this.monsters) {
          const d = Math.hypot(m.x - this.fortress.x, m.y - this.fortress.y);
          if (d < minD) {
            minD = d;
            target = m;
          }
        }
        if (target) {
          let dmg = 20;
          let speed = 300;
          let pierce = 0;
          let bounces = 0;
          
          if (el === 'flame') {
            if (this.unlockedSkills.has('flame_A')) dmg *= 1.5;
            if (this.unlockedSkills.has('flame_F')) pierce = 1;
          } else if (el === 'ice') {
            if (this.unlockedSkills.has('ice_B')) {
              // Triple shot
              const targets = this.monsters.slice(0, 3);
              if (targets.length === 0) targets.push(target);
              targets.forEach((t) => {
                this.projectiles.push({
                  id: Math.random().toString(), x: this.fortress.x, y: this.fortress.y,
                  targetId: t.id, targetX: t.x, targetY: t.y, damage: dmg, speed, source: 'fortress', heroType: el, pierceCount: this.unlockedSkills.has('ice_F') ? 3 : 0
                });
              });
              if (this.unlockedSkills.has('ice_E') && Math.random() < 0.3) {
                const bestArea = this.getBestTargetArea(60);
                this.areaEffects.push({ id: Math.random().toString(), x: bestArea.x, y: bestArea.y, radius: 60, duration: 1, type: 'blizzard', damagePerSec: 50, heroType: 'ice' });
              }
              continue;
            }
            if (this.unlockedSkills.has('ice_F')) pierce = 3;
            if (this.unlockedSkills.has('ice_E') && Math.random() < 0.3) {
              const bestArea = this.getBestTargetArea(60);
              this.areaEffects.push({ id: Math.random().toString(), x: bestArea.x, y: bestArea.y, radius: 60, duration: 1, type: 'blizzard', damagePerSec: 50, heroType: 'ice' });
            }
          } else if (el === 'lightning') {
            bounces = 3;
            if (this.unlockedSkills.has('lightning_A')) bounces += 3;
            const isCrit = this.unlockedSkills.has('lightning_C') && Math.random() < 0.5;
            if (isCrit) {
              dmg *= 2;
              if (this.unlockedSkills.has('lightning_F')) bounces += 1;
            }
            this.projectiles.push({
              id: Math.random().toString(), x: this.fortress.x, y: this.fortress.y,
              targetId: target.id, damage: dmg, speed: 500, source: 'fortress', heroType: el, pierceCount: 0, bouncesLeft: bounces, bouncedIds: new Set([target.id]), isCrit
            });
            continue;
          } else if (el === 'wind') {
            speed = 500;
            if (this.unlockedSkills.has('wind_A')) pierce = 1;
          } else if (el === 'rock') {
            dmg = 40;
            speed = 200;
            if (this.unlockedSkills.has('rock_G')) {
              // Row of spikes
              for(let j=-2; j<=2; j++) {
                this.projectiles.push({
                  id: Math.random().toString(), x: this.fortress.x + j*30, y: this.fortress.y,
                  targetX: this.fortress.x + j*30, targetY: this.fortress.y - 300, damage: dmg, speed, source: 'fortress', heroType: el, pierceCount: 5
                });
              }
              this.fortressDamageReduction = 0.5;
              this.fortressDamageReductionTimer = 3;
              continue;
            }
          } else if (el === 'shadow') {
            if (this.unlockedSkills.has('shadow_G')) {
              this.applyBuff(target, { type: 'mark', duration: 999 });
            }
          }

          this.projectiles.push({
            id: Math.random().toString(),
            x: this.fortress.x, y: this.fortress.y,
            targetId: target.id, targetX: target.x, targetY: target.y,
            damage: dmg, speed, source: 'fortress', heroType: el, pierceCount: pierce, isGiantRock: el === 'rock' && this.unlockedSkills.has('rock_A')
          });
        }
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      
      if (p.targetId) {
        const target = this.monsters.find(m => m.id === p.targetId);
        if (target) {
          p.targetX = target.x;
          p.targetY = target.y;
        } else {
          // 目标死亡，不再寻找新目标，继续飞向最后已知位置
          p.targetId = undefined;
        }
      }

      let targetX = p.targetX;
      let targetY = p.targetY;

      if (targetX === undefined || targetY === undefined) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < p.speed * dt) {
        p.x = targetX;
        p.y = targetY;
        
        // Hit logic
        const hitMonsters = this.monsters.filter(m => Math.hypot(m.x - p.x, m.y - p.y) < m.radius + 15);
        
        let hitProcessed = false;
        for (const m of hitMonsters) {
          if (p.bouncedIds && p.bouncedIds.has(m.id) && p.targetId !== m.id) continue;
          
          this.processHit(p, m);
          hitProcessed = true;
          
          if (p.pierceCount > 0) {
            p.pierceCount--;
            if (!p.bouncedIds) p.bouncedIds = new Set();
            p.bouncedIds.add(m.id);
            // Pierce: calculate a new target far away in the same direction
            if (dist > 0) {
              p.targetX = p.x + (dx / dist) * 1000;
              p.targetY = p.y + (dy / dist) * 1000;
            } else {
              p.targetY -= 1000;
            }
            p.targetId = undefined; // Stop tracking the monster
            break; // Continue projectile
          } else if (p.bouncesLeft && p.bouncesLeft > 0) {
            p.bouncesLeft--;
            if (!p.bouncedIds) p.bouncedIds = new Set();
            p.bouncedIds.add(m.id);
            // Find next target
            const nextTarget = this.monsters.find(m2 => !p.bouncedIds!.has(m2.id) && Math.hypot(m2.x - p.x, m2.y - p.y) < 150);
            if (nextTarget) {
              p.targetId = nextTarget.id;
              p.targetX = nextTarget.x;
              p.targetY = nextTarget.y;
              if (p.heroType === 'lightning' && this.unlockedSkills.has('lightning_D')) {
                this.areaEffects.push({ id: Math.random().toString(), x: p.x, y: p.y, radius: 40, duration: 2, type: 'thunder_cloud', damagePerSec: 10, heroType: 'lightning' });
              }
              break; // Continue projectile
            } else {
              this.projectiles.splice(i, 1);
              break;
            }
          } else {
            this.projectiles.splice(i, 1);
            break;
          }
        }
        
        if (!hitProcessed) {
           this.projectiles.splice(i, 1);
        }
      } else {
        p.x += (dx / dist) * p.speed * dt;
        p.y += (dy / dist) * p.speed * dt;
      }
    }

    // Update Area Effects
    for (let i = this.areaEffects.length - 1; i >= 0; i--) {
      const ae = this.areaEffects[i];
      ae.duration -= dt;
      if (ae.duration <= 0) {
        this.areaEffects.splice(i, 1);
        continue;
      }
      this.monsters.forEach(m => {
        if (m.isDead) return;
        // Apply damage (no longer invulnerable off-screen)
        if (Math.hypot(m.x - ae.x, m.y - ae.y) < ae.radius + m.radius) {
          m.hp -= ae.damagePerSec * dt;
          if (ae.type === 'ice_path' || ae.type === 'blizzard') this.applyBuff(m, { type: 'slow', duration: 0.5, value: 0.5 });
          if (ae.type === 'wind_field') this.applyBuff(m, { type: 'slow', duration: 0.5, value: 0.3 });
        }
      });
    }

    // Heroes
    this.heroes.forEach(h => {
      if (h.spine) {
        h.spine.update(dt);
      }
      
      h.lastAttackTime += dt;
      h.lastUltTime += dt;
      
      if (h.lastUltTime > h.ultCooldown) {
        h.lastUltTime = 0;
        this.useHeroUlt(h);
      } else if (h.lastAttackTime > h.attackCooldown) {
        h.lastAttackTime = 0;
        // 英雄索敌攻击
        let bestTarget = null;
        let minD = Infinity;
        for (const m of this.monsters) {
          if (m.isDead) continue;
          const d = Math.hypot(m.x - h.x, m.y - h.y);
          if (d < minD) {
            minD = d;
            bestTarget = m;
          }
        }
        if (bestTarget && minD < 450) { // Increased attack range from 350 to 450
          if (h.spine) h.spine.playRandomSkill();
          this.projectiles.push({
            id: Math.random().toString(),
            x: h.x, y: h.y,
            targetId: bestTarget.id, targetX: bestTarget.x, targetY: bestTarget.y,
            damage: 50 * h.star, speed: 400, source: 'hero', heroType: h.heroType, pierceCount: 0
          });
        }
      }

      // 英雄移动AI
      let targetX = this.fortress.x;
      let targetY = this.fortress.y;
      
      // 根据英雄类型设定不同的AI参数
      let stopDist = 80; // Reduced from 100
      let engageDist = 400; // Reduced from 600
      h.speed = 100; // Reduced from 150

      switch (h.heroType) {
        case 'rock': // 近战坦克
          stopDist = 30; // Reduced from 40
          h.speed = 80; // Reduced from 120
          engageDist = 250; // Reduced from 400
          break;
        case 'shadow': // 近战刺客
          stopDist = 40; // Reduced from 60
          h.speed = 140; // Reduced from 200
          engageDist = 300; // Reduced from 500
          break;
        case 'flame': // 中程法师
          stopDist = 120; // Reduced from 200
          h.speed = 100; // Reduced from 140
          engageDist = 400; // Reduced from 600
          break;
        case 'ice': // 远程辅助
          stopDist = 150; // Reduced from 250
          h.speed = 90; // Reduced from 130
          engageDist = 450; // Reduced from 700
          break;
        case 'lightning': // 中远程爆发
          stopDist = 130; // Reduced from 180
          h.speed = 110; // Reduced from 160
          engageDist = 400; // Reduced from 600
          break;
        case 'wind': // 灵活射手
          stopDist = 100; // Reduced from 150
          h.speed = 120; // Reduced from 180
          engageDist = 400; // Reduced from 600
          break;
      }

      let nearestMonster = null;
      let minD = Infinity;
      for (const m of this.monsters) {
        const d = Math.hypot(m.x - h.x, m.y - h.y);
        if (d < minD) {
          minD = d;
          nearestMonster = m;
        }
      }

      if (nearestMonster && minD < engageDist) {
        targetX = nearestMonster.x;
        targetY = nearestMonster.y;
      } else {
        // 如果没有敌人，跟随堡垒，保持一定距离
        stopDist = 100;
      }

      const dx = targetX - h.x;
      const dy = targetY - h.y;
      const dist = Math.hypot(dx, dy);
      
      let moveX = 0;
      let moveY = 0;

      if (dist > stopDist) {
        moveX += (dx/dist) * h.speed;
        moveY += (dy/dist) * h.speed;
      } else if (dist < stopDist - 20 && nearestMonster) {
        // 稍微后退（风筝），如果是远程的话
        if (h.heroType !== 'rock' && h.heroType !== 'shadow') {
          moveX -= (dx/dist) * h.speed * 0.5;
          moveY -= (dy/dist) * h.speed * 0.5;
        }
      }

      // 英雄之间的碰撞体积（分离力）
      let sepX = 0;
      let sepY = 0;
      const heroRadius = 25; // 英雄的碰撞半径
      for (const other of this.heroes) {
        if (other.id === h.id) continue;
        const odx = h.x - other.x;
        const ody = h.y - other.y;
        const odist = Math.hypot(odx, ody);
        if (odist < heroRadius * 2 && odist > 0) {
          // 产生排斥力，距离越近排斥力越大
          const force = Math.pow((heroRadius * 2 - odist) / (heroRadius * 2), 2);
          sepX += (odx / odist) * force * 400; // 增强排斥力系数
          sepY += (ody / odist) * force * 400;
        }
      }

      // 与堡垒的碰撞体积
      const fdx = h.x - this.fortress.x;
      const fdy = h.y - this.fortress.y;
      const fdist = Math.hypot(fdx, fdy);
      const fortressRadius = 60;
      if (fdist < fortressRadius + heroRadius && fdist > 0) {
        const force = Math.pow((fortressRadius + heroRadius - fdist) / (fortressRadius + heroRadius), 2);
        sepX += (fdx / fdist) * force * 500;
        sepY += (fdy / fdist) * force * 500;
      }

      h.x += (moveX + sepX) * dt;
      h.y += (moveY + sepY) * dt;

      // Constrain heroes to 16:9 screen relative to fortress
      const minX = this.fortress.x - 280;
      const maxX = this.fortress.x + 280;
      const minY = this.fortress.y - 580;
      const maxY = this.fortress.y + 180;

      h.x = Math.max(minX, Math.min(maxX, h.x));
      h.y = Math.max(minY, Math.min(maxY, h.y));
    });
  }

  updateEffects(dt: number) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.animTimer += dt;
      if (e.animTimer >= e.frameRate) {
        e.animTimer = 0;
        e.frameIndex++;
        if (e.frameIndex >= e.maxFrames) {
          e.isFinished = true;
          this.effects.splice(i, 1);
        }
      }
    }
  }

  spawnEffect(x: number, y: number, assetPrefix: string, maxFrames: number, scale = 1, frameRate = 0.05) {
    this.effects.push({
      id: Math.random().toString(),
      x, y,
      type: 'sprite_anim',
      frameIndex: 0,
      animTimer: 0,
      maxFrames,
      frameRate,
      scale,
      rotation: Math.random() * Math.PI * 2,
      isFinished: false,
      assetPrefix
    });
  }

  processHit(p: Projectile, m: Monster) {
    if (m.isDead) return;
    
    // Damage applied regardless of screen position

    let dmg = p.damage;
    if (m.buffs.some(b => b.type === 'freeze') && p.heroType === 'ice' && this.unlockedSkills.has('ice_C')) {
      dmg *= 2;
    }
    
    // Apply damage amp
    let dmgAmp = 1;
    if (m.buffs.some(b => b.type === 'mark' || b.type === 'curse')) dmgAmp += 0.2;
    if (m.deathWhisperStacks) dmgAmp += m.deathWhisperStacks * 0.1;
    dmg *= dmgAmp;

    m.hp -= dmg;

    // On-hit effects
    if (p.heroType === 'flame') {
      if (this.unlockedSkills.has('flame_B')) this.applyBuff(m, { type: 'burn', duration: 3, value: 5 });
      if (this.unlockedSkills.has('flame_D')) {
        this.areaEffects.push({ id: Math.random().toString(), x: m.x, y: m.y, radius: 40, duration: 0.5, type: 'burning_ground', damagePerSec: dmg, heroType: 'flame' });
      }
    } else if (p.heroType === 'ice') {
      this.applyBuff(m, { type: 'slow', duration: 2, value: this.unlockedSkills.has('ice_A') ? 0.5 : 0.3 });
      if (this.unlockedSkills.has('ice_A') && Math.random() < 0.2) {
        this.applyBuff(m, { type: 'freeze', duration: 1.5 });
        if (this.unlockedSkills.has('ice_D')) {
          this.areaEffects.push({ id: Math.random().toString(), x: m.x, y: m.y, radius: 50, duration: 1.5, type: 'ice_path', damagePerSec: 0, heroType: 'ice' });
        }
      }
    } else if (p.heroType === 'lightning') {
      if (this.unlockedSkills.has('lightning_B') && Math.random() < 0.3) {
        this.monsters.forEach(m2 => {
          if (m2 !== m && Math.hypot(m2.x - m.x, m2.y - m.y) < 80) m2.hp -= dmg * 0.5;
        });
      }
      if (p.isCrit && this.unlockedSkills.has('lightning_E')) {
        this.applyBuff(m, { type: 'paralyze', duration: 1 });
      }
    } else if (p.heroType === 'wind') {
      if (m.monsterType !== 'M001') m.y -= 10; // Knockback (Elite/Boss immune)
      if (this.unlockedSkills.has('wind_B')) {
        this.applyBuff(m, { type: 'slow', duration: 2, value: 0.2 });
        if (this.unlockedSkills.has('wind_E')) this.applyBuff(m, { type: 'armor_down', duration: 2 });
      }
      if (this.unlockedSkills.has('wind_C')) {
        this.fortressAtkSpeedBuff = Math.min(this.unlockedSkills.has('wind_F') ? 1 : 0.5, this.fortressAtkSpeedBuff + 0.05);
      }
      if (this.unlockedSkills.has('wind_D')) {
        this.monsters.forEach(m2 => {
          if (Math.hypot(m2.x - p.x, m2.y - p.y) < 100) {
            m2.x += (p.x - m2.x) * 0.1;
            m2.y += (p.y - m2.y) * 0.1;
          }
        });
      }
    } else if (p.heroType === 'rock') {
      if (m.monsterType !== 'M001') m.y -= 20; // Knockback (Elite/Boss immune)
      if (p.isGiantRock) {
        this.applyBuff(m, { type: 'stun', duration: 1 });
        if (this.unlockedSkills.has('rock_D')) {
          this.areaEffects.push({ id: Math.random().toString(), x: m.x, y: m.y, radius: 80, duration: 2, type: 'rock_wall', damagePerSec: 10, heroType: 'rock' });
        }
      }
      if (this.unlockedSkills.has('rock_B')) {
        this.monsters.forEach(m2 => {
          if (m2 !== m && Math.hypot(m2.x - m.x, m2.y - m.y) < 50) m2.hp -= dmg * 0.5;
        });
      }
      if (this.unlockedSkills.has('rock_C')) {
        this.fortressShield = Math.min(this.unlockedSkills.has('rock_F') ? 300 : 100, this.fortressShield + 10);
      }
    } else if (p.heroType === 'shadow') {
      if (this.unlockedSkills.has('shadow_B') && m.hp / m.maxHp < 0.2) {
        m.hp = 0;
      }
      this.applyBuff(m, { type: 'curse', duration: this.unlockedSkills.has('shadow_A') ? 6 : 3, value: 5 });
      if (this.unlockedSkills.has('shadow_C')) {
        this.fortress.hp = Math.min(this.fortress.maxHp, this.fortress.hp + (this.unlockedSkills.has('shadow_F') ? 10 : 5));
      }
      if (m.hp <= 0 && this.unlockedSkills.has('shadow_E')) {
        // Summon shadow clone (simplified as a projectile that seeks)
        let target = null;
        let minD = Infinity;
        for (const otherM of this.monsters) {
          if (otherM.id === m.id) continue;
          const d = Math.hypot(otherM.x - m.x, otherM.y - m.y);
          if (d < minD) {
            minD = d;
            target = otherM;
          }
        }
        if (target) {
          this.projectiles.push({
            id: Math.random().toString(), x: m.x, y: m.y, targetId: target.id, targetX: target.x, targetY: target.y,
            damage: 50, speed: 400, source: 'fortress', heroType: 'shadow', pierceCount: 0
          });
        }
      }
      if (this.unlockedSkills.has('shadow_G')) {
        m.deathWhisperStacks = (m.deathWhisperStacks || 0) + 1;
      }
    }
  }

  applyBuff(m: Monster, buff: Buff) {
    const existing = m.buffs.find(b => b.type === buff.type);
    if (existing) {
      existing.duration = Math.max(existing.duration, buff.duration);
    } else {
      m.buffs.push(buff);
    }
  }

  useHeroUlt(h: SummonedHero) {
    const target = this.getBestTargetArea(150);
    if (h.heroType === 'flame') {
      this.areaEffects.push({ id: Math.random().toString(), x: target.x, y: target.y, radius: 100, duration: 3, type: 'burning_ground', damagePerSec: 50, heroType: 'flame' });
    } else if (h.heroType === 'ice') {
      this.areaEffects.push({ id: Math.random().toString(), x: target.x, y: target.y, radius: 120, duration: 4, type: 'blizzard', damagePerSec: 30, heroType: 'ice' });
    } else if (h.heroType === 'lightning') {
      this.areaEffects.push({ id: Math.random().toString(), x: target.x, y: target.y, radius: 100, duration: 3, type: 'thunder_cloud', damagePerSec: 40, heroType: 'lightning' });
    } else if (h.heroType === 'wind') {
      this.areaEffects.push({ id: Math.random().toString(), x: target.x, y: target.y, radius: 80, duration: 4, type: 'tornado', damagePerSec: 20, heroType: 'wind' });
    } else if (h.heroType === 'rock') {
      this.areaEffects.push({ id: Math.random().toString(), x: target.x, y: target.y, radius: 150, duration: 5, type: 'rock_wall', damagePerSec: 10, heroType: 'rock' });
    } else if (h.heroType === 'shadow') {
      const strongest = this.monsters.reduce((prev, curr) => (curr.hp > prev.hp ? curr : prev), this.monsters[0]);
      if (strongest) {
        h.x = strongest.x;
        h.y = strongest.y + 20;
        strongest.hp -= 500;
        if (strongest.hp <= 0) h.lastUltTime = h.ultCooldown; // Reset
      }
    }
  }

  triggerElementSkill(type: HeroType) {
    const target = this.getBestTargetArea(150);
    const targetX = target.x;
    const targetY = target.y;

    if (type === 'flame') {
      this.areaEffects.push({ id: Math.random().toString(), x: targetX, y: targetY, radius: 100, duration: 3, type: 'burning_ground', damagePerSec: 30, heroType: 'flame' });
    } else if (type === 'ice') {
      this.monsters.forEach(m => {
        if (Math.hypot(m.x - targetX, m.y - targetY) < 150) this.applyBuff(m, { type: 'freeze', duration: 2 });
      });
      this.areaEffects.push({ id: Math.random().toString(), x: targetX, y: targetY, radius: 150, duration: 3, type: 'ice_path', damagePerSec: 0, heroType: 'ice' });
    } else if (type === 'lightning') {
      const target = this.monsters.find(m => Math.hypot(m.x - targetX, m.y - targetY) < 200);
      if (target) {
        this.projectiles.push({
          id: Math.random().toString(), x: this.fortress.x, y: this.fortress.y,
          targetId: target.id, targetX: target.x, targetY: target.y, damage: 100, speed: 800, source: 'fortress', heroType: 'lightning', pierceCount: 0, bouncesLeft: 5, bouncedIds: new Set([target.id])
        });
      }
    } else if (type === 'wind') {
      this.areaEffects.push({ id: Math.random().toString(), x: targetX, y: targetY, radius: 120, duration: 3, type: 'tornado', damagePerSec: 10, heroType: 'wind' });
    } else if (type === 'rock') {
      this.areaEffects.push({ id: Math.random().toString(), x: targetX, y: targetY, radius: 150, duration: 4, type: 'rock_wall', damagePerSec: 20, heroType: 'rock' });
      this.monsters.forEach(m => {
        if (Math.hypot(m.x - targetX, m.y - targetY) < 150) m.y -= 50;
      });
    } else if (type === 'shadow') {
      const nearbyMonsters = this.monsters
        .filter(m => Math.hypot(m.x - targetX, m.y - targetY) < 200)
        .slice(0, 3);
      nearbyMonsters.forEach(m => this.applyBuff(m, { type: 'mark', duration: 5 }));
    }
  }


  usePlayerSkill() {
    if (this.playerSkillCd <= 0) {
      this.fortress.hp = Math.min(this.fortress.maxHp, this.fortress.hp + this.fortress.maxHp * 0.2);
      this.playerSkillCd = 10;
      this.onSyncUI?.();
    }
  }

  summonHero() {
    if (this.coins >= this.summonCost) {
      const emptyIdx = this.grid.findIndex((s, i) => s === null && i < this.unlockedSlotsCount);
      if (emptyIdx !== -1) {
        this.coins -= this.summonCost;
        this.summonCount++;
        this.grid[emptyIdx] = {
          id: Math.random().toString(),
          heroType: this.activeElements[Math.floor(Math.random() * this.activeElements.length)],
          star: 1
        };
        this.onSyncUI?.();
      }
    }
  }

  mergeSlots(fromIdx: number, toIdx: number) {
    // Prevent interaction with locked slots
    if (fromIdx >= this.unlockedSlotsCount || toIdx >= this.unlockedSlotsCount) return;

    const from = this.grid[fromIdx];
    const to = this.grid[toIdx];
    if (!from) return;

    if (!to) {
      this.grid[toIdx] = from;
      this.grid[fromIdx] = null;
    } else if (from.heroType === to.heroType && from.star === to.star && fromIdx !== toIdx) {
      if (to.star < 3) {
        this.grid[toIdx] = { ...to, star: to.star + 1 };
        this.grid[fromIdx] = null;
        
        // Trigger Element Skill
        this.triggerElementSkill(to.heroType);
        
        this.gainEnergy(1);
        
        if (this.grid[toIdx]!.star === 3) {
          const hero: SummonedHero = {
            id: Math.random().toString(),
            x: this.fortress.x + (Math.random()-0.5)*100,
            y: this.fortress.y + (Math.random()-0.5)*100,
            hp: 500, maxHp: 500, speed: 60, radius: 15,
            heroType: to.heroType, star: 3, attackCooldown: 1, lastAttackTime: 0, ultCooldown: 10, lastUltTime: 0
          };
          
          this.heroes.push(hero);
          this.grid[toIdx] = null;
        }
      }
    } else {
      this.grid[toIdx] = from;
      this.grid[fromIdx] = to;
    }
    this.onSyncUI?.();
  }

  gainEnergy(amount: number) {
    this.energy += amount;
    if (this.energy >= this.maxEnergy) {
      this.energy -= this.maxEnergy;
      this.maxEnergy += 2;
      this.level++;
      this.triggerSkillSelection();
    }
  }

  triggerSkillSelection() {
    this.isSkillSelection = true;
    
    // Determine which elements to use for skill pool
    // 优先从已召唤的英雄中选择技能，如果没有英雄则从已携带的英雄中选择
    const summonedHeroTypes = Array.from(new Set(this.heroes.map(h => h.heroType)));
    const poolElements = summonedHeroTypes.length > 0 ? summonedHeroTypes : this.activeElements;

    // Generate 3 choices
    const availableSkills: SkillNode[] = [];
    poolElements.forEach(el => {
      const tree = SKILL_TREES[el];
      if (tree) {
        tree.forEach(node => {
          if (!this.unlockedSkills.has(node.id)) {
            const reqsMet = node.reqs.every(req => this.unlockedSkills.has(req));
            if (reqsMet) {
              availableSkills.push(node);
            }
          }
        });
      }
    });

    // Shuffle and pick 3
    for (let i = availableSkills.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableSkills[i], availableSkills[j]] = [availableSkills[j], availableSkills[i]];
    }
    this.skillChoices = availableSkills.slice(0, 3);
    
    this.onSkillSelection?.();
  }

  selectSkill(skillId: string) {
    this.unlockedSkills.add(skillId);
    this.isSkillSelection = false;
    this.skillChoices = [];
    this.onSyncUI?.();
  }
}
