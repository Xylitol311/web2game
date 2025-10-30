// ============================================
// PLAYER CLASS
// ============================================

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Stats
        this.hp = CONFIG.PLAYER_START_HP;
        this.maxHp = CONFIG.PLAYER_START_HP;
        this.speed = CONFIG.PLAYER_SPEED;
        this.isInvincible = false;
        this.invincibilityEndTime = 0;
        this.hasCloak = false;
        this.damageReduction = 0;
        
        // Buffs
        this.speedMultiplier = 1.0;
        this.buffEndTime = 0;
        
        // Visual
        this.body.setSize(CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        this.createVisual();
        
        // Input
        this.cursors = null;
    }
    
    createVisual() {
        // Body (gentleman in hanbok)
        this.bodyGraphics = this.scene.add.graphics();
        this.bodyGraphics.setDepth(6);
        
        // HP Bar above player
        this.hpBarBg = this.scene.add.rectangle(0, 0, 50, 6, 0x000000);
        this.hpBarBg.setDepth(7);
        
        this.hpBar = this.scene.add.rectangle(0, 0, 50, 6, 0x00ff00);
        this.hpBar.setDepth(8);
        
        this.updateVisual();
    }
    
    updateVisual() {
        if (!this.bodyGraphics) return;
        
        this.bodyGraphics.clear();
        
        const size = CONFIG.TILE_SIZE;
        
        // Invincibility glow
        if (this.isInvincible) {
            this.bodyGraphics.fillStyle(0xffffff, 0.3);
            this.bodyGraphics.fillCircle(this.x, this.y, size/2 + 5);
        }
        
        // Body (hanbok - traditional Korean clothing)
        this.bodyGraphics.fillStyle(0x4a7ba7); // Blue hanbok
        this.bodyGraphics.fillRect(
            this.x - size/2,
            this.y - size/4,
            size,
            size * 0.75
        );
        
        // Head
        this.bodyGraphics.fillStyle(0xffdbac); // Skin color
        this.bodyGraphics.fillCircle(this.x, this.y - size/3, size/3);
        
        // Hat (traditional Korean hat - gat)
        this.bodyGraphics.fillStyle(0x2d2d2d);
        this.bodyGraphics.fillEllipse(this.x, this.y - size/2, size * 0.8, size/4);
        this.bodyGraphics.fillRect(
            this.x - size/4,
            this.y - size/2 - 5,
            size/2,
            10
        );
        
        // Cloak indicator
        if (this.hasCloak) {
            this.bodyGraphics.lineStyle(2, 0x8b4513);
            this.bodyGraphics.strokeCircle(this.x, this.y, size/2 + 3);
        }
    }
    
    setInput(cursors) {
        this.cursors = cursors;
    }
    
    update(pointer) {
        if (!this.cursors) return;
        
        // Movement
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.cursors.left.isDown) {
            velocityX = -1;
        } else if (this.cursors.right.isDown) {
            velocityX = 1;
        }
        
        if (this.cursors.up.isDown) {
            velocityY = -1;
        } else if (this.cursors.down.isDown) {
            velocityY = 1;
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        const currentSpeed = this.speed * this.speedMultiplier;
        this.setVelocity(velocityX * currentSpeed, velocityY * currentSpeed);
        
        // Clamp position to world bounds
        this.x = Phaser.Math.Clamp(this.x, CONFIG.TILE_SIZE, CONFIG.WORLD_SIZE - CONFIG.TILE_SIZE);
        this.y = Phaser.Math.Clamp(this.y, CONFIG.TILE_SIZE, CONFIG.WORLD_SIZE - CONFIG.TILE_SIZE);
        
        // Face mouse cursor
        if (pointer) {
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y, pointer.worldX, pointer.worldY
            );
            this.setRotation(angle);
        }
        
        // Update invincibility
        if (this.isInvincible && Date.now() > this.invincibilityEndTime) {
            this.isInvincible = false;
        }
        
        // Update speed buff
        if (Date.now() > this.buffEndTime) {
            this.speedMultiplier = 1.0;
        }
        
        // Update visual
        this.updateVisual();
        
        // Update HP bar position (above player's head)
        const hpBarY = this.y - CONFIG.TILE_SIZE/2 - 10;
        this.hpBarBg.setPosition(this.x, hpBarY);
        this.hpBar.setPosition(this.x, hpBarY);
        
        // Update HP bar width
        const hpPercent = this.hp / this.maxHp;
        this.hpBar.width = 50 * hpPercent;
        
        // Update HP bar color
        if (hpPercent > 0.5) {
            this.hpBar.setFillStyle(0x00ff00);
        } else if (hpPercent > 0.25) {
            this.hpBar.setFillStyle(0xffff00);
        } else {
            this.hpBar.setFillStyle(0xff0000);
        }
    }
    
    takeDamage(amount) {
        if (this.isInvincible) return 0;
        
        // Apply cloak damage reduction
        if (this.hasCloak) {
            amount *= (1 - this.damageReduction);
        }
        
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        
        // Activate invincibility
        this.isInvincible = true;
        this.invincibilityEndTime = Date.now() + CONFIG.PLAYER_INVINCIBILITY_TIME;
        
        // Flash effect
        this.scene.tweens.add({
            targets: this.bodyGraphics,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 3
        });
        
        return amount;
    }
    
    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) {
            this.hp = this.maxHp;
        }
        
        // Heal effect
        const healCircle = this.scene.add.circle(this.x, this.y, 30, 0x00ff00, 0.5);
        healCircle.setDepth(10);
        this.scene.tweens.add({
            targets: healCircle,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => healCircle.destroy()
        });
    }
    
    equipCloak() {
        this.hasCloak = true;
        this.damageReduction = CONFIG.ITEMS.CLOAK.damageReduction;
        GameState.hasCloak = true;
    }
    
    applySpeedBuff(duration) {
        this.speedMultiplier = 1.2;
        this.buffEndTime = Date.now() + duration;
    }
    
    isDead() {
        return this.hp <= 0;
    }
    
    getHPPercent() {
        return this.hp / this.maxHp;
    }
    
    cleanup() {
        if (this.bodyGraphics) {
            this.bodyGraphics.destroy();
        }
        if (this.hpBarBg) {
            this.hpBarBg.destroy();
        }
        if (this.hpBar) {
            this.hpBar.destroy();
        }
    }
}
