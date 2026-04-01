import { 
  AssetManager, 
  AtlasAttachmentLoader, 
  SkeletonJson, 
  SkeletonData, 
  AnimationStateData, 
  AnimationState, 
  SkeletonRenderer,
  Skeleton,
  Physics
} from "@esotericsoftware/spine-canvas";

export class SpineActor {
  protected skeleton: Skeleton;
  protected animationState: AnimationState;
  protected initialized: boolean = false;

  constructor(skeletonData: SkeletonData) {
    this.skeleton = new Skeleton(skeletonData);
    this.animationState = new AnimationState(new AnimationStateData(skeletonData));
  }

  setAnimation(name: string, loop: boolean) {
    const current = this.animationState.getCurrent(0);
    if (current && current.animation.name === name) return;
    this.animationState.setAnimation(0, name, loop);
  }

  update(dt: number) {
    this.animationState.update(dt);
    this.animationState.apply(this.skeleton);
    this.skeleton.updateWorldTransform(Physics.update);
  }
}

export class SpineFortress extends SpineActor {
  private currentRotation: number = 0;
  private targetRotation: number = 0;
  private rotationSpeed: number = 8;

  constructor(skeletonData: SkeletonData) {
    super(skeletonData);
    this.skeleton.scaleX = 0.16;
    this.skeleton.scaleY = 0.16;
  }

  render(ctx: CanvasRenderingContext2D, renderer: SkeletonRenderer, x: number, y: number, rotation: number) {
    if (!this.initialized) {
        this.currentRotation = rotation;
        this.targetRotation = rotation;
        this.initialized = true;
    } else {
        this.targetRotation = rotation;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.currentRotation);
    
    this.skeleton.scaleX = 0.16;
    this.skeleton.scaleY = -0.16; 
    
    ctx.translate(0, 40); 
    
    this.skeleton.x = 0;
    this.skeleton.y = 0;
    this.skeleton.updateWorldTransform(Physics.update);
    renderer.draw(this.skeleton);
    ctx.restore();
  }

  // Override update to include rotation smoothing
  update(dt: number) {
    super.update(dt);
    if (!this.initialized) return;

    let diff = this.targetRotation - this.currentRotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    if (Math.abs(diff) > 0.001) {
        const step = this.rotationSpeed * dt;
        if (Math.abs(diff) <= step) {
            this.currentRotation = this.targetRotation;
        } else {
            this.currentRotation += Math.sign(diff) * step;
        }
    } else {
        this.currentRotation = this.targetRotation;
    }
  }
}

export class SpineMonster extends SpineActor {
  private skillAnimations: string[] = [];
  private monsterType: string;

  constructor(skeletonData: SkeletonData, type: string, scale: number = 0.15) {
    super(skeletonData);
    this.monsterType = type;
    this.skeleton.scaleX = scale;
    this.skeleton.scaleY = scale;
    
    // Find all animations starting with 'skill'
    this.skillAnimations = skeletonData.animations
      .map(a => a.name)
      .filter(name => name.startsWith('skill'));
    
    if (this.skillAnimations.length === 0) {
        // Fallback if no skill animations found
        const hasAttack = skeletonData.animations.some(a => a.name === 'attack');
        if (hasAttack) this.skillAnimations.push('attack');
    }
  }

  playRandomSkill() {
    if (this.skillAnimations.length === 0) return;
    const randomSkill = this.skillAnimations[Math.floor(Math.random() * this.skillAnimations.length)];
    this.animationState.setAnimation(0, randomSkill, false);
    // After skill, queue run
    this.animationState.addAnimation(0, 'run', true, 0);
  }

  render(ctx: CanvasRenderingContext2D, renderer: SkeletonRenderer, x: number, y: number, rotation: number, flipX: boolean = false) {
    ctx.save();
    ctx.translate(x, y);
    
    // M002 rotation is 0, M001 keeps the previous rotation (-Math.PI)
    const finalRotation = this.monsterType === 'M002' ? rotation : (rotation - Math.PI);
    ctx.rotate(finalRotation); 
    
    if (flipX) {
      ctx.scale(-1, 1);
    }
    
    // Spine Y is up, Canvas Y is down
    const originalScaleY = this.skeleton.scaleY;
    this.skeleton.scaleY = -Math.abs(originalScaleY); 
    
    this.skeleton.x = 0;
    this.skeleton.y = 0;
    this.skeleton.updateWorldTransform(Physics.update);
    renderer.draw(this.skeleton);
    
    // Restore scaleY for next frame update logic if needed
    this.skeleton.scaleY = originalScaleY;
    
    ctx.restore();
  }
}

export class SpineHero extends SpineActor {
  private skillAnimations: string[] = [];

  constructor(skeletonData: SkeletonData, scale: number = 0.15) {
    super(skeletonData);
    this.skeleton.scaleX = scale;
    this.skeleton.scaleY = scale;
    
    // Find all animations starting with 'skill'
    this.skillAnimations = skeletonData.animations
      .map(a => a.name)
      .filter(name => name.startsWith('skill'));
    
    if (this.skillAnimations.length === 0) {
        const hasAttack = skeletonData.animations.some(a => a.name === 'attack');
        if (hasAttack) this.skillAnimations.push('attack');
    }
  }

  playRandomSkill() {
    if (this.skillAnimations.length === 0) return;
    const randomSkill = this.skillAnimations[Math.floor(Math.random() * this.skillAnimations.length)];
    this.animationState.setAnimation(0, randomSkill, false);
    this.animationState.addAnimation(0, 'run', true, 0);
  }

  render(ctx: CanvasRenderingContext2D, renderer: SkeletonRenderer, x: number, y: number, rotation: number, flipX: boolean = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation); 
    
    if (flipX) {
      ctx.scale(-1, 1);
    }
    
    const originalScaleY = this.skeleton.scaleY;
    this.skeleton.scaleY = -Math.abs(originalScaleY); 
    
    this.skeleton.x = 0;
    this.skeleton.y = 0;
    this.skeleton.updateWorldTransform(Physics.update);
    renderer.draw(this.skeleton);
    
    this.skeleton.scaleY = originalScaleY;
    ctx.restore();
  }
}

export class SpineManager {
  private assetManager: AssetManager;
  private skeletonDataMap: Map<string, SkeletonData> = new Map();

  constructor() {
    this.assetManager = new AssetManager("");
  }

  async load() {
    const roles: string[] = []; // Removed C002
    for (const role of roles) {
      const baseUrl = `/res/role/${role}/`;
      this.assetManager.loadJson(baseUrl + "skeleton.json");
      this.assetManager.loadTextureAtlas(baseUrl + "skeleton.atlas");
    }

    try {
        await this.assetManager.loadAll();
        
        if (this.assetManager.hasErrors()) {
            console.error("Spine load errors:", this.assetManager.getErrors());
        }

        for (const role of roles) {
          const baseUrl = `/res/role/${role}/`;
          const atlas = this.assetManager.get(baseUrl + "skeleton.atlas");
          const skeletonRawData = this.assetManager.get(baseUrl + "skeleton.json");
          
          if (atlas && skeletonRawData) {
            const atlasLoader = new AtlasAttachmentLoader(atlas);
            const skeletonJson = new SkeletonJson(atlasLoader);
            const data = skeletonJson.readSkeletonData(skeletonRawData);
            this.skeletonDataMap.set(role, data);
            console.log(`Spine data loaded: ${role}`);
          }
        }
    } catch (e) {
        console.error("Spine load error:", e);
        throw e;
    }
  }

  createFortress() {
    return null;
  }

  createHero(type: string, scale: number = 0.15) {
    const data = this.skeletonDataMap.get(type);
    if (!data) return null;
    return new SpineHero(data, scale);
  }
}

export const spineManager = new SpineManager();
