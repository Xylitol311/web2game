// ============================================
// WEAPON SYSTEM
// ============================================

class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.damage = 0;
        this.lifespan = 0;
        this.startTime = 0;
        this.isCrit = false;
        
        // Visual representation
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(5);
    }
    
    fire(x, y, angle, config) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        
        this.damage = config.damage;
        this.isCrit = Math.random() < (config.critChance || 0);
        if (this.isCrit) {
            this.damage = config.critDamage || this.damage;
        }
        
        this.lifespan = (config.range / config.projectileSpeed) * 1000;
        this.startTime = Date.now();
        
        // Set velocity
        const velocity = this.scene.physics.velocityFromAngle(angle, config.projectileSpeed);
        this.setVelocity(velocity.x, velocity.y);
        this.setRotation(Phaser.Math.DegToRad(angle));
        
        // Draw arrow
        this.drawArrow();
    }
    
    drawArrow() {
        this.graphics.clear();
        this.graphics.lineStyle(2, this.isCrit ? 0xff0000 : 0x8b4513);
        this.graphics.beginPath();
        this.graphics.moveTo(this.x - 8, this.y);
        this.graphics.lineTo(this.x + 8, this.y);
        this.graphics.strokePath();
        
        // Arrow head
        this.graphics.fillStyle(this.isCrit ? 0xff0000 : 0x8b4513);
        this.graphics.fillTriangle(
            this.x + 8, this.y,
            this.x + 12, this.y - 3,
            this.x + 12, this.y + 3
        );
    }
    
    update() {
        if (!this.active) return;
        
        // Update arrow position
        this.drawArrow();
        
        // Check lifespan
        if (Date.now() - this.startTime > this.lifespan) {
            this.deactivate();
        }
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocity(0, 0);
        this.graphics.clear();
    }
}

class Bomb extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.throwTime = 0;
        this.fuseTime = CONFIG.WEAPONS.BOMB.fuseTime;
        this.hasExploded = false;
        
        // Visual
        this.circle = scene.add.circle(x, y, 8, 0x2d2d2d);
        this.circle.setStrokeStyle(2, 0xff0000);
        this.circle.setDepth(5);
    }
    
    throw(x, y, targetX, targetY) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.hasExploded = false;
        
        this.throwTime = Date.now();
        
        // Store target position for precise landing
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Calculate throw velocity to reach exact target
        const distance = Phaser.Math.Distance.Between(x, y, targetX, targetY);
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        
        // Calculate speed needed to reach target in fuseTime
        const timeToTarget = this.fuseTime / 1000; // convert to seconds
        const speed = distance / timeToTarget;
        
        this.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        // Update circle position
        this.circle.setPosition(x, y);
        this.circle.setVisible(true);
    }
    
    update() {
        if (!this.active) return;
        
        // Update visual position
        this.circle.setPosition(this.x, this.y);
        
        // Check if reached target or time expired
        const timeElapsed = Date.now() - this.throwTime;
        
        // Stop at target position when time is up
        if (timeElapsed >= this.fuseTime - 50) { // Stop slightly before explosion
            if (this.targetX !== undefined && this.targetY !== undefined) {
                this.setPosition(this.targetX, this.targetY);
            }
            this.setVelocity(0, 0);
        }
        
        // Flash effect as it's about to explode
        const timeLeft = this.fuseTime - timeElapsed;
        if (timeLeft < 500) {
            this.circle.setAlpha(Math.sin(Date.now() / 50) * 0.5 + 0.5);
        }
        
        // Check if should explode
        if (timeElapsed >= this.fuseTime && !this.hasExploded) {
            this.explode();
        }
    }
    
    explode() {
        this.hasExploded = true;
        
        // Store explosion position for damage calculation
        this.explosionX = this.x;
        this.explosionY = this.y;
        
        // Create explosion visual
        const explosion = this.scene.add.circle(
            this.x, this.y,
            CONFIG.WEAPONS.BOMB.explosionRadius,
            0xff6600, 0.6
        );
        explosion.setDepth(10);
        
        // Animate explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        // Damage handled in game scene
        // Deactivate after 100ms to ensure damage is processed
        this.scene.time.delayedCall(100, () => {
            this.deactivate();
        });
    }
    
    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocity(0, 0);
        this.circle.setVisible(false);
    }
}

class WeaponSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Current weapon
        this.currentWeapon = 'bow';
        this.weapons = {
            bow: { ...CONFIG.WEAPONS.BOW, ammo: CONFIG.WEAPONS.BOW.startAmmo, unlocked: true },
            spear: { ...CONFIG.WEAPONS.SPEAR, unlocked: true },
            sword: { ...CONFIG.WEAPONS.SWORD, unlocked: true },
            bomb: { ...CONFIG.WEAPONS.BOMB, unlocked: false }
        };
        
        // Cooldowns
        this.lastFireTime = 0;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        // Projectile pool
        this.projectiles = this.scene.physics.add.group({
            classType: Projectile,
            maxSize: 30,
            runChildUpdate: true
        });
        
        // Bomb pool
        this.bombs = this.scene.physics.add.group({
            classType: Bomb,
            maxSize: 5,
            runChildUpdate: true
        });
        
        // Buffs
        this.attackSpeedMultiplier = 1.0;
        this.attackPowerMultiplier = 1.0;
        this.buffEndTime = 0;
        
        // Bomb aiming system
        this.isAiming = false;
        this.aimStartPos = null;
        this.aimGraphics = this.scene.add.graphics();
        this.aimGraphics.setDepth(100);
    }
    
    switchWeapon(weaponKey) {
        if (this.weapons[weaponKey] && this.weapons[weaponKey].unlocked) {
            this.currentWeapon = weaponKey;
            this.isReloading = false;
        }
    }
    
    attack(pointer) {
        const weapon = this.weapons[this.currentWeapon];
        if (!weapon) return false;
        
        const now = Date.now();
        
        // Check reload
        if (this.isReloading) {
            if (now - this.reloadStartTime >= weapon.reloadTime) {
                this.isReloading = false;
                weapon.ammo = CONFIG.WEAPONS.BOW.startAmmo;
            } else {
                return false;
            }
        }
        
        // Check cooldown
        const cooldown = (weapon.fireRate || weapon.cooldown) / this.attackSpeedMultiplier;
        if (now - this.lastFireTime < cooldown) {
            return false;
        }
        
        // Attack based on weapon type
        let attacked = false;
        
        if (weapon.type === 'ranged') {
            attacked = this.fireProjectile(pointer, weapon);
        } else if (weapon.type === 'melee') {
            attacked = this.meleeAttack(pointer, weapon);
        } else if (weapon.type === 'throwable') {
            attacked = this.throwBomb(pointer, weapon);
        }
        
        if (attacked) {
            this.lastFireTime = now;
        }
        
        return attacked;
    }
    
    fireProjectile(pointer, weapon) {
        if (weapon.ammo <= 0) {
            return false;
        }
        
        weapon.ammo--;
        
        const angle = Phaser.Math.RadToDeg(
            Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY)
        );
        
        const projectile = this.projectiles.get();
        if (projectile) {
            const offsetX = Math.cos(Phaser.Math.DegToRad(angle)) * 20;
            const offsetY = Math.sin(Phaser.Math.DegToRad(angle)) * 20;
            
            const config = {
                ...weapon,
                damage: weapon.damage * this.attackPowerMultiplier
            };
            
            projectile.fire(
                this.player.x + offsetX,
                this.player.y + offsetY,
                angle,
                config
            );
        }
        
        return true;
    }
    
    meleeAttack(pointer, weapon) {
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y, pointer.worldX, pointer.worldY
        );
        
        // Create temporary melee hitbox
        const hitbox = {
            x: this.player.x,
            y: this.player.y,
            angle: angle,
            range: weapon.range,
            arcAngle: Phaser.Math.DegToRad(weapon.angle),
            damage: weapon.damage * this.attackPowerMultiplier
        };
        
        // Visual feedback with distinct colors and effects
        if (weapon.id === 'spear') {
            this.drawSpearAttack(hitbox);
        } else {
            this.drawSwordAttack(hitbox);
        }
        
        // Store for collision detection
        this.currentMeleeHitbox = hitbox;
        this.scene.time.delayedCall(100, () => {
            this.currentMeleeHitbox = null;
        });
        
        return true;
    }
    
    throwBomb(pointer, weapon) {
        const bomb = this.bombs.get();
        if (bomb) {
            bomb.throw(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        }
        return true;
    }
    
    drawSpearAttack(hitbox) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(10);
        
        const startAngle = hitbox.angle - hitbox.arcAngle / 2;
        const endAngle = hitbox.angle + hitbox.arcAngle / 2;
        const color = 0xd4a944; // golden brown
        
        // Narrow cone with thrust effect
        graphics.fillStyle(color, 0.5);
        graphics.slice(hitbox.x, hitbox.y, hitbox.range, startAngle, endAngle, false);
        graphics.fillPath();
        
        // Strong center thrust line
        graphics.lineStyle(6, 0xffd700, 0.9);
        graphics.beginPath();
        graphics.moveTo(hitbox.x, hitbox.y);
        graphics.lineTo(
            hitbox.x + Math.cos(hitbox.angle) * hitbox.range,
            hitbox.y + Math.sin(hitbox.angle) * hitbox.range
        );
        graphics.strokePath();
        
        // Side edges
        graphics.lineStyle(3, color, 0.8);
        graphics.beginPath();
        graphics.moveTo(hitbox.x, hitbox.y);
        graphics.lineTo(
            hitbox.x + Math.cos(startAngle) * hitbox.range,
            hitbox.y + Math.sin(startAngle) * hitbox.range
        );
        graphics.moveTo(hitbox.x, hitbox.y);
        graphics.lineTo(
            hitbox.x + Math.cos(endAngle) * hitbox.range,
            hitbox.y + Math.sin(endAngle) * hitbox.range
        );
        graphics.strokePath();
        
        // Thrust particles
        for (let i = 0; i < 3; i++) {
            const dist = hitbox.range * (0.5 + i * 0.2);
            const px = hitbox.x + Math.cos(hitbox.angle) * dist;
            const py = hitbox.y + Math.sin(hitbox.angle) * dist;
            const particle = this.scene.add.circle(px, py, 3, 0xffd700, 0.8);
            particle.setDepth(11);
            
            this.scene.tweens.add({
                targets: particle,
                scale: 0,
                alpha: 0,
                duration: 200,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }
        
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 250,
            ease: 'Power2',
            onComplete: () => graphics.destroy()
        });
    }
    
    drawSwordAttack(hitbox) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(10);
        
        const startAngle = hitbox.angle - hitbox.arcAngle / 2;
        const endAngle = hitbox.angle + hitbox.arcAngle / 2;
        const color = 0x87ceeb; // light blue
        
        // Wide arc slash
        graphics.fillStyle(color, 0.4);
        graphics.slice(hitbox.x, hitbox.y, hitbox.range, startAngle, endAngle, false);
        graphics.fillPath();
        
        // Thick arc border
        graphics.lineStyle(5, 0x4682b4, 0.9);
        graphics.beginPath();
        graphics.arc(hitbox.x, hitbox.y, hitbox.range, startAngle, endAngle);
        graphics.strokePath();
        
        // Slash trail effect
        const midAngle = (startAngle + endAngle) / 2;
        for (let i = 0; i < 5; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / 4);
            const trailGraphics = this.scene.add.graphics();
            trailGraphics.setDepth(9);
            trailGraphics.lineStyle(3, 0xffffff, 0.6);
            trailGraphics.beginPath();
            trailGraphics.moveTo(hitbox.x, hitbox.y);
            trailGraphics.lineTo(
                hitbox.x + Math.cos(angle) * hitbox.range,
                hitbox.y + Math.sin(angle) * hitbox.range
            );
            trailGraphics.strokePath();
            
            this.scene.tweens.add({
                targets: trailGraphics,
                alpha: 0,
                duration: 200,
                delay: i * 30,
                onComplete: () => trailGraphics.destroy()
            });
        }
        
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => graphics.destroy()
        });
    }
    
    reload() {
        const weapon = this.weapons[this.currentWeapon];
        if (weapon && weapon.type === 'ranged' && weapon.ammo < CONFIG.WEAPONS.BOW.startAmmo) {
            this.isReloading = true;
            this.reloadStartTime = Date.now();
        }
    }
    
    addAmmo(amount) {
        if (this.weapons.bow) {
            this.weapons.bow.ammo += amount;
        }
    }
    
    unlockBomb() {
        this.weapons.bomb.unlocked = true;
    }
    
    applySpeedBuff(duration) {
        this.attackSpeedMultiplier = 1.2;
        this.buffEndTime = Date.now() + duration;
    }
    
    applyPowerBuff(duration) {
        this.attackPowerMultiplier = 1.2;
        this.buffEndTime = Date.now() + duration;
    }
    
    update() {
        // Check buff expiration
        if (Date.now() > this.buffEndTime) {
            this.attackSpeedMultiplier = 1.0;
            this.attackPowerMultiplier = 1.0;
        }
    }
    
    getCurrentWeaponInfo() {
        const weapon = this.weapons[this.currentWeapon];
        return {
            name: weapon.name || this.currentWeapon,
            ammo: weapon.ammo,
            isReloading: this.isReloading,
            reloadProgress: this.isReloading ? 
                (Date.now() - this.reloadStartTime) / weapon.reloadTime : 0
        };
    }
}
