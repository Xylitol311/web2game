// ============================================
// SHOP UI SYSTEM
// ============================================

class ShopUI {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.container = null;
        this.items = [];
        this.selectedIndex = 0;
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.createUI();
        
        // Pause game
        this.scene.physics.pause();
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.destroyUI();
        
        // Resume game
        this.scene.physics.resume();
    }
    
    createUI() {
        const camera = this.scene.cameras.main;
        const centerX = camera.width / 2;
        const centerY = camera.height / 2;
        
        // Background overlay
        this.overlay = this.scene.add.rectangle(
            0, 0,
            camera.width, camera.height,
            0x000000, 0.8
        );
        this.overlay.setOrigin(0);
        this.overlay.setScrollFactor(0);
        this.overlay.setDepth(2000);
        this.overlay.setInteractive();
        
        // Shop panel
        this.panel = this.scene.add.rectangle(
            centerX, centerY,
            500, 400,
            0x2d1810
        );
        this.panel.setStrokeStyle(4, 0xd4a944);
        this.panel.setScrollFactor(0);
        this.panel.setDepth(2001);
        
        // Title
        this.title = this.scene.add.text(centerX, centerY - 170, '상점 (Shop)', {
            fontSize: '28px',
            color: '#d4a944',
            fontStyle: 'bold'
        });
        this.title.setOrigin(0.5);
        this.title.setScrollFactor(0);
        this.title.setDepth(2002);
        
        // Coins display
        this.coinsText = this.scene.add.text(centerX, centerY - 140, `보유 코인: ${GameState.coins}`, {
            fontSize: '18px',
            color: '#ffd700'
        });
        this.coinsText.setOrigin(0.5);
        this.coinsText.setScrollFactor(0);
        this.coinsText.setDepth(2002);
        
        // Shop items
        this.createShopItems(centerX, centerY);
        
        // Instructions
        this.instructions = this.scene.add.text(centerX, centerY + 170, '[클릭하여 구매] [ESC] 닫기', {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.instructions.setOrigin(0.5);
        this.instructions.setScrollFactor(0);
        this.instructions.setDepth(2002);
    }
    
    createShopItems(centerX, centerY) {
        const items = [
            { type: 'ARROWS', config: CONFIG.ITEMS.ARROWS },
            { type: 'HEAL_POTION', config: CONFIG.ITEMS.HEAL_POTION },
            { type: 'SPEED_BUFF', config: CONFIG.ITEMS.SPEED_BUFF },
            { type: 'POWER_BUFF', config: CONFIG.ITEMS.POWER_BUFF },
            { type: 'VISION', config: CONFIG.ITEMS.VISION },
            { type: 'CLOAK', config: CONFIG.ITEMS.CLOAK },
            { type: 'BOMB_ITEM', config: CONFIG.ITEMS.BOMB_ITEM }
        ];
        
        const startY = centerY - 100;
        const itemHeight = 40;
        
        items.forEach((item, index) => {
            const y = startY + (index * itemHeight);
            
            // Check if already purchased (for one-time items)
            const isPurchased = item.config.oneTime && 
                (item.type === 'CLOAK' && GameState.hasCloak);
            
            // Item background
            const bg = this.scene.add.rectangle(
                centerX, y,
                450, 35,
                isPurchased ? 0x444444 : 0x4a3520
            );
            bg.setStrokeStyle(2, 0x8b6f47);
            bg.setScrollFactor(0);
            bg.setDepth(2001);
            
            if (!isPurchased) {
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerover', () => {
                    bg.setFillStyle(0x6a5530);
                });
                bg.on('pointerout', () => {
                    bg.setFillStyle(0x4a3520);
                });
                bg.on('pointerdown', () => {
                    this.purchaseItem(item.type, item.config);
                });
            }
            
            // Item name
            const name = this.scene.add.text(
                centerX - 200, y,
                isPurchased ? `${item.config.name} (구매완료)` : item.config.name,
                {
                    fontSize: '16px',
                    color: isPurchased ? '#888888' : '#ffffff'
                }
            );
            name.setOrigin(0, 0.5);
            name.setScrollFactor(0);
            name.setDepth(2002);
            
            // Price
            const price = this.scene.add.text(
                centerX + 200, y,
                isPurchased ? '' : `${item.config.price} 코인`,
                {
                    fontSize: '16px',
                    color: '#ffd700'
                }
            );
            price.setOrigin(1, 0.5);
            price.setScrollFactor(0);
            price.setDepth(2002);
            
            this.items.push({ bg, name, price, type: item.type, config: item.config, isPurchased });
        });
    }
    
    purchaseItem(itemType, itemConfig) {
        // Check if enough coins
        if (GameState.coins < itemConfig.price) {
            this.showMessage('코인이 부족합니다!', 0xff0000);
            return;
        }
        
        // Check if already purchased (one-time items)
        if (itemConfig.oneTime) {
            if (itemType === 'CLOAK' && GameState.hasCloak) {
                this.showMessage('이미 구매한 아이템입니다!', 0xff0000);
                return;
            }
        }
        
        // Deduct coins
        GameState.coins -= itemConfig.price;
        this.updateCoinsDisplay();
        
        // Apply item effect
        switch(itemType) {
            case 'ARROWS':
                const amount = Phaser.Math.Between(5, 10);
                this.scene.weaponSystem.addAmmo(amount);
                this.showMessage(`화살 ${amount}개 획득!`, 0x00ff00);
                break;
                
            case 'HEAL_POTION':
                this.scene.itemManager.addToInventory(itemType);
                this.showMessage('회복 물약 획득!', 0x00ff00);
                break;
                
            case 'SPEED_BUFF':
                this.scene.itemManager.addToInventory(itemType);
                this.showMessage('속도 강화 획득!', 0x00ff00);
                break;
                
            case 'POWER_BUFF':
                this.scene.itemManager.addToInventory(itemType);
                this.showMessage('공격 강화 획득!', 0x00ff00);
                break;
                
            case 'VISION':
                this.scene.itemManager.addToInventory(itemType);
                this.showMessage('시야 확장 획득!', 0x00ff00);
                break;
                
            case 'CLOAK':
                this.scene.player.equipCloak();
                this.showMessage('방어 망토 장착! (30% 피해 감소)', 0x00ff00);
                // Refresh UI to show as purchased
                this.close();
                this.open();
                break;
                
            case 'BOMB_ITEM':
                this.scene.weaponSystem.unlockBomb();
                this.showMessage('폭탄 무기 해금!', 0x00ff00);
                break;
        }
    }
    
    showMessage(text, color) {
        const camera = this.scene.cameras.main;
        const msg = this.scene.add.text(camera.width / 2, camera.height / 2 + 100, text, {
            fontSize: '20px',
            color: '#' + color.toString(16).padStart(6, '0'),
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        msg.setOrigin(0.5);
        msg.setScrollFactor(0);
        msg.setDepth(2003);
        
        this.scene.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 50,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }
    
    updateCoinsDisplay() {
        if (this.coinsText) {
            this.coinsText.setText(`보유 코인: ${GameState.coins}`);
        }
    }
    
    destroyUI() {
        if (this.overlay) this.overlay.destroy();
        if (this.panel) this.panel.destroy();
        if (this.title) this.title.destroy();
        if (this.coinsText) this.coinsText.destroy();
        if (this.instructions) this.instructions.destroy();
        
        this.items.forEach(item => {
            if (item.bg) item.bg.destroy();
            if (item.name) item.name.destroy();
            if (item.price) item.price.destroy();
        });
        
        this.items = [];
    }
}
