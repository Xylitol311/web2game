// ============================================
// ZOMBIE CLASSES
// ============================================

class Zombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, zombieType) {
        super(scene, x, y, null);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.zombieType = zombieType;
        this.config = CONFIG.ZOMBIES[zombieType];
        
        // Stats
        this.hp = this.config.hp;
        this.maxHp = this.config.hp;
        this.speed = this.config.speed;
        this.damage = this.config.damage;
        this.attackCooldown = this.config.attackCooldown;
        this.lastAttackTime = 0;
        
        // Visual
        this.body.setSize(CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        this.createVisual();
        
        // AI
        this.target = null;
        this.pathUpdateTimer = 0;
        this.pathUpdateInterval = 500; // Update path every 500ms
        
        // Special abilities
        if (this.config.type === 'shooter') {
            this.projectiles = [];
        }
    }
    
    createVisual() {
        // Body
        this.bodyGraphics = this.scene.add.graphics();
        this.bodyGraphics.setDepth(4);
        
        const size = CONFIG.TILE_SIZE * this.config.scale;
        this.bodyGraphics.fillStyle(this.config.color);
        this.bodyGraphics.fillRect(
            this.x - size/2,
            this.y - size/2,
            size,
            size
        );
        
        // Eyes (creepy)
        this.bodyGraphics.fillStyle(0xff0000);
        this.bodyGraphics.fillCircle(this.x - size/4, this.y - size/4, 3);
        this.bodyGraphics.fillCircle(this.x + size/4, this.y - size/4, 3);
        
        // HP bar
        this.hpBar = this.scene.add.graphics();
        this.hpBar.setDepth(5);
        this.updateHPBar();
        
        // 좀비 이름 표시
        const zombieNames = {
            'REGULAR': 'Zombie',
            'TANK': 'Tank',
            'SPEED': 'Speed',
            'BERSERKER': 'Berserker',
            'SHOOTER': 'Shooter'
        };
        
        this.nameText = this.scene.add.text(this.x, this.y + size/2 + 5, zombieNames[this.zombieType] || 'Zombie', {
            fontSize: '10px',
            color: '#ff6666',
            backgroundColor: '#000000',
            padding: { x: 2, y: 1 }
        });
        this.nameText.setOrigin(0.5, 0);
        this.nameText.setDepth(5);
    }
    
    updateVisual() {
        if (!this.bodyGraphics) return;
        
        this.bodyGraphics.clear();
        const size = CONFIG.TILE_SIZE * this.config.scale;
        
        // Body
        this.bodyGraphics.fillStyle(this.config.color);
        this.bodyGraphics.fillRect(
            this.x - size/2,
            this.y - size/2,
            size,
            size
        );
        
        // Eyes
        this.bodyGraphics.fillStyle(0xff0000);
        this.bodyGraphics.fillCircle(this.x - size/4, this.y - size/4, 3);
        this.bodyGraphics.fillCircle(this.x + size/4, this.y - size/4, 3);
        
        // Speed zombie blur effect
        if (this.config.type === 'speed' && this.body.velocity.length() > 0) {
            this.bodyGraphics.fillStyle(this.config.color, 0.3);
            const angle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
            const offsetX = -Math.cos(angle) * 15;
            const offsetY = -Math.sin(angle) * 15;
            this.bodyGraphics.fillRect(
                this.x - size/2 + offsetX,
                this.y - size/2 + offsetY,
                size,
                size
            );
        }
    }
    
    updateHPBar() {
        if (!this.hpBar) return;
        
        this.hpBar.clear();
        const barWidth = 30;
        const barHeight = 4;
        const x = this.x - barWidth/2;
        const y = this.y - CONFIG.TILE_SIZE/2 - 10;
        
        // Background
        this.hpBar.fillStyle(0x000000);
        this.hpBar.fillRect(x, y, barWidth, barHeight);
        
        // HP
        const hpPercent = this.hp / this.maxHp;
        const color = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffff00 : 0xff0000;
        this.hpBar.fillStyle(color);
        this.hpBar.fillRect(x, y, barWidth * hpPercent, barHeight);
    }
    
    update(time, delta, player, obstacles) {
        if (!this.active) return;
        
        this.target = player;
        
        // Update path periodically
        this.pathUpdateTimer += delta;
        if (this.pathUpdateTimer >= this.pathUpdateInterval) {
            this.pathUpdateTimer = 0;
            this.updatePath(obstacles);
        }
        
        // Move towards player
        this.moveTowardsTarget();
        
        // Clamp position to world bounds
        this.x = Phaser.Math.Clamp(this.x, CONFIG.TILE_SIZE, CONFIG.WORLD_SIZE - CONFIG.TILE_SIZE);
        this.y = Phaser.Math.Clamp(this.y, CONFIG.TILE_SIZE, CONFIG.WORLD_SIZE - CONFIG.TILE_SIZE);
        
        // Update name text position
        if (this.nameText) {
            const size = CONFIG.TILE_SIZE * this.config.scale;
            this.nameText.setPosition(this.x, this.y + size/2 + 5);
        }
        
        // Update visuals
        this.updateVisual();
        this.updateHPBar();
        
        // Special abilities
        if (this.config.type === 'shooter') {
            this.shooterBehavior(time);
        }
    }
    
    updatePath(obstacles) {
        if (!this.target) return;
        
        // Simple pathfinding: move towards player, avoid obstacles
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.pathDirection = {
                x: dx / distance,
                y: dy / distance
            };
        }
    }
    
    moveTowardsTarget() {
        if (!this.pathDirection) return;
        
        this.setVelocity(
            this.pathDirection.x * this.speed,
            this.pathDirection.y * this.speed
        );
    }
    
    shooterBehavior(time) {
        if (!this.target) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y, this.target.x, this.target.y
        );
        
        // Shoot if in range and cooldown ready
        if (distance <= this.config.projectileRange && 
            time - this.lastAttackTime >= this.attackCooldown) {
            this.shootProjectile();
            this.lastAttackTime = time;
        }
    }
    
    shootProjectile() {
        const angle = Phaser.Math.Angle.Between(
            this.x, this.y, this.target.x, this.target.y
        );
        
        const projectile = {
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 150,
            vy: Math.sin(angle) * 150,
            damage: this.config.projectileDamage,
            graphics: this.scene.add.graphics(),
            active: true,
            startTime: Date.now()
        };
        
        projectile.graphics.setDepth(5);
        this.projectiles.push(projectile);
        
        // Update projectile
        const updateProjectile = () => {
            if (!projectile.active) return;
            
            projectile.x += projectile.vx * 0.016;
            projectile.y += projectile.vy * 0.016;
            
            projectile.graphics.clear();
            projectile.graphics.fillStyle(0x88ff00);
            projectile.graphics.fillCircle(projectile.x, projectile.y, 4);
            
            // Check lifespan
            if (Date.now() - projectile.startTime > 2000) {
                projectile.active = false;
                projectile.graphics.destroy();
            } else {
                requestAnimationFrame(updateProjectile);
            }
        };
        
        updateProjectile();
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        
        // Flash effect
        this.scene.tweens.add({
            targets: this.bodyGraphics,
            alpha: 0.3,
            duration: 100,
            yoyo: true
        });
        
        this.updateHPBar();
        
        if (this.hp <= 0) {
            return true; // Dead
        }
        return false;
    }
    
    canAttack(time) {
        return time - this.lastAttackTime >= this.attackCooldown;
    }
    
    attack(time) {
        this.lastAttackTime = time;
        return this.damage;
    }
    
    die() {
        // Death animation
        const targets = [this.bodyGraphics, this.hpBar];
        if (this.nameText) targets.push(this.nameText);
        
        this.scene.tweens.add({
            targets: targets,
            alpha: 0,
            scale: 0.5,
            duration: 300,
            onComplete: () => {
                if (this.bodyGraphics) this.bodyGraphics.destroy();
                if (this.hpBar) this.hpBar.destroy();
                if (this.nameText) this.nameText.destroy();
                this.destroy();
            }
        });
        
        return this.config.coinDrop;
    }
    
    cleanup() {
        if (this.bodyGraphics) this.bodyGraphics.destroy();
        if (this.hpBar) this.hpBar.destroy();
        if (this.nameText) this.nameText.destroy();
        if (this.projectiles) {
            this.projectiles.forEach(p => {
                if (p.graphics) p.graphics.destroy();
            });
        }
    }
}

class ZombieSpawner {
    constructor(scene) {
        this.scene = scene;
        this.zombies = [];
        this.spawnTimer = 0;
        this.nextSpawnTime = 0;
        this.totalSpawned = 0;
        this.maxZombies = 0;
        this.difficulty = null;
        this.periodicSpawnTimer = 0; // 주기적 스폰 타이머
    }
    
    initialize(difficulty) {
        this.difficulty = CONFIG.DIFFICULTIES[difficulty];
        this.maxZombies = this.difficulty.regularZombies + this.difficulty.specialZombies;
        this.totalSpawned = 0;
        this.spawnTimer = 0;
        this.periodicSpawnTimer = 0;
        this.setNextSpawnTime();
    }
    
    setNextSpawnTime() {
        this.nextSpawnTime = Phaser.Math.Between(
            CONFIG.SPAWN.MIN_INTERVAL,
            CONFIG.SPAWN.MAX_INTERVAL
        );
    }
    
    update(time, delta, player, obstacles) {
        // Update all zombies
        this.zombies.forEach(zombie => {
            if (zombie.active) {
                zombie.update(time, delta, player, obstacles);
            }
        });
        
        // Initial spawn (up to maxZombies)
        if (this.totalSpawned < this.maxZombies) {
            this.spawnTimer += delta;
            
            if (this.spawnTimer >= this.nextSpawnTime) {
                this.spawnZombie();
                this.spawnTimer = 0;
                this.setNextSpawnTime();
            }
        }
        
        // Periodic spawn (after initial spawn is complete)
        if (this.totalSpawned >= this.maxZombies) {
            this.periodicSpawnTimer += delta;
            
            if (this.periodicSpawnTimer >= this.difficulty.spawnInterval) {
                // Spawn multiple zombies at once
                for (let i = 0; i < this.difficulty.spawnCount; i++) {
                    this.spawnZombie();
                }
                this.periodicSpawnTimer = 0;
            }
        }
    }
    
    spawnZombie() {
        // Determine zombie type
        let zombieType = 'REGULAR';
        
        if (Math.random() < CONFIG.SPAWN.SPECIAL_CHANCE) {
            // Spawn special zombie
            const specialTypes = ['TANK', 'SPEED', 'BERSERKER', 'SHOOTER'];
            zombieType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
        }
        
        // Random spawn position at map edge
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;
        
        const margin = CONFIG.SPAWN.EDGE_MARGIN;
        const worldSize = CONFIG.WORLD_SIZE;
        
        switch(edge) {
            case 0: // top
                x = Phaser.Math.Between(margin, worldSize - margin);
                y = margin;
                break;
            case 1: // right
                x = worldSize - margin;
                y = Phaser.Math.Between(margin, worldSize - margin);
                break;
            case 2: // bottom
                x = Phaser.Math.Between(margin, worldSize - margin);
                y = worldSize - margin;
                break;
            case 3: // left
                x = margin;
                y = Phaser.Math.Between(margin, worldSize - margin);
                break;
        }
        
        const zombie = new Zombie(this.scene, x, y, zombieType);
        this.zombies.push(zombie);
        this.totalSpawned++;
    }
    
    removeZombie(zombie) {
        zombie.cleanup();
        this.zombies = this.zombies.filter(z => z !== zombie);
    }
    
    clear() {
        this.zombies.forEach(zombie => zombie.cleanup());
        this.zombies = [];
        this.totalSpawned = 0;
    }
    
    getActiveZombies() {
        return this.zombies.filter(z => z.active);
    }
}
