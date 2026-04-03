export type HeroType = 'flame' | 'ice' | 'lightning' | 'wind' | 'rock' | 'shadow';

export interface GridSlot {
  id: string;
  heroType: HeroType;
  star: number;
}

export interface Waypoint {
  x: number;
  y: number;
  type: 'start' | 'normal' | 'elite1' | 'elite2' | 'elite3' | 'boss';
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
}

export interface Buff {
  type: 'burn' | 'freeze' | 'slow' | 'paralyze' | 'airborne' | 'stun' | 'curse' | 'mark' | 'armor_down';
  duration: number;
  value?: number;
  sourceId?: string;
}

export interface Fortress extends Entity {
  baseSpeed: number;
  targetWpIdx: number;
  rotation: number;
  // Sequence animation state
  currentAnim?: 'idle' | 'run';
  frameIndex?: number;
  animTimer?: number;
}

export interface Monster extends Entity {
  damage: number;
  attackCooldown: number;
  lastAttackTime: number;
  isAttacking: boolean;
  buffs: Buff[];
  deathWhisperStacks?: number;
  spine?: any; // SpineMonster instance
  monsterType?: 'M001' | 'M002';
  flipX?: boolean;
  // Sequence animation state
  currentAnim?: 'idle' | 'run' | 'death' | 'appear' | 'skill';
  frameIndex?: number;
  animTimer?: number;
  isDead?: boolean;
  deathTimer?: number;
  alpha?: number; // For fade-in effect
  scale?: number;
}

export interface SummonedHero extends Entity {
  heroType: HeroType;
  star: number;
  attackCooldown: number;
  lastAttackTime: number;
  ultCooldown: number;
  lastUltTime: number;
  targetId?: string;
  spine?: any; // SpineHero instance
  // Sequence animation state
  currentAnim?: 'run';
  frameIndex?: number;
  animTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId?: string;
  targetX?: number;
  targetY?: number;
  damage: number;
  speed: number;
  source: 'fortress' | 'hero';
  heroType: HeroType;
  pierceCount: number;
  bouncesLeft?: number;
  bouncedIds?: Set<string>;
  isCrit?: boolean;
  isGiantRock?: boolean;
}

export interface GameEffect {
  id: string;
  x: number;
  y: number;
  type: string;
  frameIndex: number;
  animTimer: number;
  maxFrames: number;
  frameRate: number;
  scale: number;
  rotation: number;
  isFinished: boolean;
  assetPrefix: string;
}

export interface AreaEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  duration: number;
  type: 'burning_ground' | 'ice_path' | 'thunder_cloud' | 'tornado' | 'rock_wall' | 'blizzard' | 'wind_field';
  damagePerSec: number;
  heroType: HeroType;
}

export interface SkillNode {
  id: string;
  heroType: HeroType;
  tier: 'basic' | 'advanced' | 'ultimate';
  name: string;
  desc: string;
  reqs: string[];
}

export interface Tile {
  id: number;
  src: string;
}

export interface TileMapData {
  width: number;
  height: number;
  tileSize: number;
  layers: number[][][]; // [layer][y][x]
  worldX: number;
  worldY: number;
}

export interface Decoration {
  x: number;
  y: number;
  type: string; // 'dec_1', 'dec_2', etc.
  scale: number;
  rotation: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  difficulty: number;
  rewardTickets: number;
  waypoints: Waypoint[];
  monsterHpMult: number;
  monsterSpeedMult: number;
  spawnIntervalMult: number;
  mapData?: TileMapData;
  backgroundAsset?: string;
  floorAsset?: string;
  decorations?: Decoration[];
}

export interface PlayerHero {
  type: HeroType;
  level: number;
  star: number;
  shards: number;
  isDeployed: boolean;
}

export interface ResourceNode extends Entity {
  type: 'wood' | 'stone' | 'steel';
}

export interface PlayerCharacter extends Entity {
  attackCooldown: number;
  lastAttackTime: number;
}

export interface MaterialCount {
  wood: number;
  stone: number;
  steel: number;
}

export interface PlayerState {
  upgradeTickets: number; // 密卷
  summonTickets: number;  // 升官帽
  gold: number;
  gems: number;
  stamina: number;
  maxStamina: number;
  heroes: Record<HeroType, PlayerHero>;
  formation: (HeroType | null)[]; // 编队，最多4个位置
  unlockedLevels: number;
  prologueCompleted: boolean;
}

