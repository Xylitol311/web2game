// ============================================
// ITEM SYSTEM
// ============================================

class Item extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, itemType) {
        super(scene, x, y, null);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.itemType = itemType;
        this.itemConfig = CONFIG.ITEMS[itemType];
        
        // Visual
        this.circle = scene.add.circle(x, y, 12, this.getItemColor());
        this.circle.setStrokeStyle(2, 0xffffff);
        this.circle.setDepth(3);
        
        // 아이템 이름 텍스트
        this.nameText = scene.add.text(x, y + 20, this.itemConfig.name, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 3, y: 2 }
        });
        this.nameText.setOrigin(0.5, 0);
        this.nameText.setDepth(3);
        
        // Floating animation
        scene.tweens.add({
            targets: [this.circle, this.nameText],
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    getItemColor() {
        switch(this.itemType) {
            case 'HEAL_POTION': return 0xff0000;
            case 'SPEED_BUFF': return 0x00ffff;
            case 'POWER_BUFF': return 0xff6600;
            case 'VISION': return 0xffff00;
            case 'ARROWS': return 0x8b4513;
            default: return 0xffffff;
        }
    }
    
    pickup() {
        if (this.nameText) this.nameText.destroy();
        this.circle.destroy();
        this.destroy();
    }
}

class Coin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, value) {
        super(scene, x, y, null);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.value = value;
        
        // Visual
        this.circle = scene.add.circle(x, y, 8, CONFIG.COLORS.COIN);
        this.circle.setStrokeStyle(2, 0xffaa00);
        this.circle.setDepth(3);
        
        // 코인 텍스트
        this.nameText = this.scene.add.text(x, y + 15, 'Coin', {
            fontSize: '11px',
            color: '#ffd700',
            backgroundColor: '#000000',
            padding: { x: 2, y: 1 }
        });
        this.nameText.setOrigin(0.5, 0);
        this.nameText.setDepth(3);
        
        // Floating animation
        scene.tweens.add({
            targets: [this.circle, this.nameText],
            y: y - 3,
            scale: 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    pickup() {
        // Animate to player
        if (this.nameText) this.nameText.destroy();
        this.scene.tweens.add({
            targets: this.circle,
            scale: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.circle.destroy();
                this.destroy();
            }
        });
    }
}

class ItemManager {
    constructor(scene) {
        this.scene = scene;
        this.items = [];
        this.coins = [];
        this.inventory = [];
        this.maxSlots = CONFIG.GAME.MAX_ITEM_SLOTS;
        this.itemCooldowns = {};
    }
    
    dropItem(x, y, itemType) {
        const item = new Item(this.scene, x, y, itemType);
        this.items.push(item);
        return item;
    }
    
    dropCoin(x, y, value) {
        const coin = new Coin(this.scene, x, y, value);
        this.coins.push(coin);
        return coin;
    }
    
    pickupItem(item, weaponSystem = null) {
        // 화살은 즉시 충전 (인벤토리에 넣지 않음)
        if (item.itemType === 'ARROWS' && weaponSystem) {
            const itemConfig = CONFIG.ITEMS.ARROWS;
            weaponSystem.addAmmo(itemConfig.amount);
            item.pickup();
            this.items = this.items.filter(i => i !== item);
            return true;
        }
        
        // 다른 아이템은 인벤토리에 추가
        if (this.inventory.length < this.maxSlots) {
            this.inventory.push(item.itemType);
            item.pickup();
            this.items = this.items.filter(i => i !== item);
            return true;
        }
        return false;
    }
    
    pickupCoin(coin) {
        GameState.coins += coin.value;
        coin.pickup();
        this.coins = this.coins.filter(c => c !== coin);
    }
    
    useItem(index, player, weaponSystem, fogOfWar) {
        if (index >= this.inventory.length) return false;
        
        const itemType = this.inventory[index];
        const itemConfig = CONFIG.ITEMS[itemType];
        
        // Check cooldown
        const now = Date.now();
        if (this.itemCooldowns[itemType] && now < this.itemCooldowns[itemType]) {
            return false;
        }
        
        // Use item
        let used = false;
        
        switch(itemType) {
            case 'HEAL_POTION':
                if (player.hp < CONFIG.PLAYER_START_HP) {
                    player.heal(itemConfig.healAmount);
                    used = true;
                }
                break;
                
            case 'SPEED_BUFF':
                weaponSystem.applySpeedBuff(itemConfig.duration);
                player.applySpeedBuff(itemConfig.duration);
                used = true;
                break;
                
            case 'POWER_BUFF':
                weaponSystem.applyPowerBuff(itemConfig.duration);
                used = true;
                break;
                
            case 'VISION':
                if (GameState.visionBonus < itemConfig.maxStacks * itemConfig.radiusIncrease) {
                    fogOfWar.increaseVision(itemConfig.radiusIncrease);
                    used = true;
                }
                break;
                
            case 'ARROWS':
                weaponSystem.addAmmo(itemConfig.amount);
                used = true;
                break;
        }
        
        if (used) {
            // Set cooldown
            if (itemConfig.cooldown) {
                this.itemCooldowns[itemType] = now + itemConfig.cooldown;
            }
            
            // Remove from inventory
            this.inventory.splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    cycleItem() {
        if (this.inventory.length > 1) {
            const first = this.inventory.shift();
            this.inventory.push(first);
        }
    }
    
    addToInventory(itemType) {
        if (this.inventory.length < this.maxSlots) {
            this.inventory.push(itemType);
            return true;
        }
        return false;
    }
    
    checkAutoPickup(player, weaponSystem = null) {
        const pickupRadius = CONFIG.GAME.AUTO_PICKUP_RADIUS;
        
        // Check coins
        this.coins.forEach(coin => {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y, coin.x, coin.y
            );
            if (distance < pickupRadius) {
                this.pickupCoin(coin);
            }
        });
        
        // Check items
        this.items.forEach(item => {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y, item.x, item.y
            );
            if (distance < pickupRadius) {
                this.pickupItem(item, weaponSystem);
            }
        });
    }
    
    getItemCooldown(itemType) {
        const now = Date.now();
        if (this.itemCooldowns[itemType] && now < this.itemCooldowns[itemType]) {
            return (this.itemCooldowns[itemType] - now) / 1000;
        }
        return 0;
    }
    
    clear() {
        this.items.forEach(item => {
            if (item.circle) item.circle.destroy();
            item.destroy();
        });
        this.coins.forEach(coin => {
            if (coin.circle) coin.circle.destroy();
            coin.destroy();
        });
        this.items = [];
        this.coins = [];
        this.inventory = [];
        this.itemCooldowns = {};
    }
}
