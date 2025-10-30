// ============================================
// MAIN GAME - PHASER SCENES
// ============================================

// Menu Scene - Difficulty Selection
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x1a1a1a)
            .setOrigin(0);
        
        // Title
        const title = this.add.text(centerX, centerY - 150, 'Kingdom Zombie', {
            fontSize: '48px',
            color: '#d4a944',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        
        const subtitle = this.add.text(centerX, centerY - 100, 'Joseon Zombie Survival', {
            fontSize: '24px',
            color: '#ffffff'
        });
        subtitle.setOrigin(0.5);
        
        // High score
        if (GameState.highScore > 0) {
            const highScore = this.add.text(centerX, centerY - 60, `High Score: ${GameState.highScore} Coins`, {
                fontSize: '18px',
                color: '#ffd700'
            });
            highScore.setOrigin(0.5);
        }
        
        // Difficulty buttons
        const difficulties = ['EASY', 'NORMAL', 'HELL'];
        const startY = centerY;
        
        difficulties.forEach((diff, index) => {
            const y = startY + (index * 70);
            const config = CONFIG.DIFFICULTIES[diff];
            
            // Button background
            const button = this.add.rectangle(centerX, y, 400, 60, 0x4a3520);
            button.setStrokeStyle(3, 0x8b6f47);
            button.setInteractive({ useHandCursor: true });
            
            // Button text
            const text = this.add.text(centerX, y - 10, config.label, {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            text.setOrigin(0.5);
            
            // Details
            const details = this.add.text(centerX, y + 15, 
                `Zombies: ${config.regularZombies + config.specialZombies} | Drop Rate: ${(config.dropRate * 100).toFixed(0)}%`, {
                fontSize: '14px',
                color: '#cccccc'
            });
            details.setOrigin(0.5);
            
            // Hover effects
            button.on('pointerover', () => {
                button.setFillStyle(0x6a5530);
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x4a3520);
            });
            
            button.on('pointerdown', () => {
                GameState.selectedDifficulty = diff;
                this.scene.start('GameScene');
            });
        });
        
        // Instructions
        const instructions = this.add.text(centerX, centerY + 240, 
            'WASD: Move | Mouse: Aim/Attack | R: Reload | E: Use Item | Q: Switch Item\n1-4: Switch Weapon | F: Interact', {
            fontSize: '12px',
            color: '#888888',
            align: 'center'
        });
        instructions.setOrigin(0.5);
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        // Reset game state
        GameState.coins = 0;
        GameState.timeElapsed = 0;
        GameState.visionBonus = 0;
        GameState.totalCoinsEarned = 0;
        GameState.zombiesKilled = {
            total: 0,
            REGULAR: 0,
            TANK: 0,
            SPEED: 0,
            BERSERKER: 0,
            SHOOTER: 0
        };
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
        
        // Create map
        this.mapGenerator = new MapGenerator(this);
        this.mapGenerator.generate();
        
        // Create player
        const centerX = CONFIG.WORLD_SIZE / 2;
        const centerY = CONFIG.WORLD_SIZE / 2;
        this.player = new Player(this, centerX, centerY);
        
        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D')
        };
        this.player.setInput(this.wasd);
        
        // Additional keys
        this.keys = {
            reload: this.input.keyboard.addKey('R'),
            use: this.input.keyboard.addKey('E'),
            cycle: this.input.keyboard.addKey('Q'),
            interact: this.input.keyboard.addKey('F'),
            weapon1: this.input.keyboard.addKey('ONE'),
            weapon2: this.input.keyboard.addKey('TWO'),
            weapon3: this.input.keyboard.addKey('THREE'),
            weapon4: this.input.keyboard.addKey('FOUR'),
            esc: this.input.keyboard.addKey('ESC')
        };
        
        // Create systems
        this.weaponSystem = new WeaponSystem(this, this.player);
        this.itemManager = new ItemManager(this);
        this.zombieSpawner = new ZombieSpawner(this);
        this.zombieSpawner.initialize(GameState.selectedDifficulty);
        this.fogOfWar = new FogOfWar(this);
        this.fogOfWar.create();
        this.shopUI = new ShopUI(this);
        
        // Setup camera
        this.cameras.main.setBounds(0, 0, CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        
        // Setup collisions
        this.setupCollisions();
        
        // Create HUD
        this.createHUD();
        
        // Game timer
        this.gameStartTime = Date.now();
        this.gameEnded = false;
        this.isPaused = false;
        
        // Mouse input
        this.input.on('pointerdown', (pointer) => {
            if (!this.shopUI.isOpen && !this.gameEnded && !this.isPaused) {
                // 폭탄일 경우 조준 시작
                if (this.weaponSystem.currentWeapon === 'bomb') {
                    this.weaponSystem.isAiming = true;
                    this.weaponSystem.aimStartPos = { x: pointer.worldX, y: pointer.worldY };
                } else {
                    this.weaponSystem.attack(pointer);
                }
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (!this.shopUI.isOpen && !this.gameEnded && !this.isPaused) {
                // 폭탄 조준 종료 및 발사
                if (this.weaponSystem.isAiming && this.weaponSystem.currentWeapon === 'bomb') {
                    this.weaponSystem.throwBomb(pointer, this.weaponSystem.weapons.bomb);
                    this.weaponSystem.isAiming = false;
                    this.weaponSystem.aimStartPos = null;
                    this.weaponSystem.aimGraphics.clear();
                }
            }
        });
        
        // Key press handlers
        this.setupKeyHandlers();
        
        // Create pause menu (hidden initially)
        this.createPauseMenu();
    }
    
    setupCollisions() {
        // Player vs obstacles
        const obstacleBodies = this.mapGenerator.getObstacleBodies();
        obstacleBodies.forEach(body => {
            this.physics.add.collider(this.player, body);
        });
        
        // Zombies vs obstacles
        this.physics.add.collider(
            this.zombieSpawner.zombies,
            obstacleBodies
        );
        
        // Player vs zombies (handled in update)
        // Projectiles vs zombies (handled in update)
    }
    
    setupKeyHandlers() {
        this.keys.reload.on('down', () => {
            if (!this.shopUI.isOpen && !this.gameEnded) {
                this.weaponSystem.reload();
            }
        });
        
        this.keys.use.on('down', () => {
            if (!this.shopUI.isOpen && !this.gameEnded) {
                this.itemManager.useItem(0, this.player, this.weaponSystem, this.fogOfWar);
            }
        });
        
        this.keys.cycle.on('down', () => {
            if (!this.shopUI.isOpen && !this.gameEnded) {
                this.itemManager.cycleItem();
            }
        });
        
        this.keys.interact.on('down', () => {
            if (this.gameEnded || this.isPaused) return;
            
            if (this.shopUI.isOpen) {
                this.shopUI.close();
            } else {
                const interaction = this.mapGenerator.checkInteraction(this.player);
                if (interaction && interaction.type === 'shop') {
                    this.shopUI.open();
                }
            }
        });
        
        this.keys.weapon1.on('down', () => {
            if (!this.shopUI.isOpen && !this.gameEnded) {
                this.weaponSystem.switchWeapon('bow');
            }
        });
        
        this.keys.weapon2.on('down', () => {
            if (!this.shopUI.isOpen && !this.gameEnded) {
                this.weaponSystem.switchWeapon('spear');
            }
        });
        
        this.keys.weapon3.on('down', () => {
            if (!this.shopUI.isOpen && !this.gameEnded) {
                this.weaponSystem.switchWeapon('sword');
            }
        });
        
        this.keys.weapon4.on('down', () => {
            if (!this.shopUI.isOpen && !this.gameEnded) {
                this.weaponSystem.switchWeapon('bomb');
            }
        });
        
        this.keys.esc.on('down', () => {
            if (this.shopUI.isOpen) {
                this.shopUI.close();
            } else if (!this.gameEnded) {
                this.togglePause();
            }
        });
    }
    
    createHUD() {
        const camera = this.cameras.main;
        
        // Timer (상단 중앙)
        this.timerText = this.add.text(camera.width / 2, 20, '00:00', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 12, y: 6 },
            fontStyle: 'bold'
        });
        this.timerText.setOrigin(0.5, 0);
        this.timerText.setScrollFactor(0);
        this.timerText.setDepth(1000);
        
        // Coins (우측 상단)
        this.coinsText = this.add.text(camera.width - 20, 20, 'Coins: 0', {
            fontSize: '22px',
            color: '#ffd700',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.coinsText.setOrigin(1, 0);
        this.coinsText.setScrollFactor(0);
        this.coinsText.setDepth(1000);
        
        // HP Bar는 플레이어 머리 위에 표시됨 (player.js에서 처리)
        
        // 무기 슬롯 (좌측 하단) - 4개
        this.weaponSlots = [];
        const weaponStartX = 30;
        const weaponStartY = camera.height - 100;
        const weaponSlotSize = 60;
        const weaponGap = 10;
        
        const weapons = ['bow', 'spear', 'sword', 'bomb'];
        const weaponNames = ['Bow', 'Spear', 'Sword', 'Bomb'];
        const weaponKeys = ['1', '2', '3', '4'];
        
        for (let i = 0; i < 4; i++) {
            const x = weaponStartX + (i * (weaponSlotSize + weaponGap));
            const y = weaponStartY;
            
            // 슬롯 배경
            const slot = this.add.rectangle(x, y, weaponSlotSize, weaponSlotSize, 0x2d2d2d);
            slot.setStrokeStyle(3, 0x8b6f47);
            slot.setScrollFactor(0);
            slot.setDepth(1000);
            slot.setOrigin(0, 0);
            
            // 무기 아이콘 (텍스트로 대체)
            const icon = this.add.text(x + weaponSlotSize/2, y + weaponSlotSize/2 - 5, weaponNames[i], {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            icon.setOrigin(0.5);
            icon.setScrollFactor(0);
            icon.setDepth(1001);
            
            // 키 표시 (하단 중앙)
            const keyText = this.add.text(x + weaponSlotSize/2, y + weaponSlotSize - 8, weaponKeys[i], {
                fontSize: '14px',
                color: '#ffff00',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            });
            keyText.setOrigin(0.5, 1);
            keyText.setScrollFactor(0);
            keyText.setDepth(1001);
            
            // 화살 개수 표시 (우측 상단, 활만)
            let ammoText = null;
            if (i === 0) {
                ammoText = this.add.text(x + weaponSlotSize - 5, y + 5, '10', {
                    fontSize: '14px',
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 3, y: 1 }
                });
                ammoText.setOrigin(1, 0);
                ammoText.setScrollFactor(0);
                ammoText.setDepth(1002);
            }
            
            this.weaponSlots.push({ slot, icon, keyText, ammoText, weaponId: weapons[i] });
        }
        
        // 아이템 슬롯 (우측 하단) - 1개만
        const itemX = camera.width - 30 - weaponSlotSize;
        const itemY = camera.height - 100;
        
        this.itemSlot = this.add.rectangle(itemX, itemY, weaponSlotSize, weaponSlotSize, 0x2d2d2d);
        this.itemSlot.setStrokeStyle(3, 0x8b6f47);
        this.itemSlot.setScrollFactor(0);
        this.itemSlot.setDepth(1000);
        this.itemSlot.setOrigin(0, 0);
        
        this.itemIcon = this.add.text(itemX + weaponSlotSize/2, itemY + weaponSlotSize/2 - 5, '', {
            fontSize: '16px',
            color: '#ffffff'
        });
        this.itemIcon.setOrigin(0.5);
        this.itemIcon.setScrollFactor(0);
        this.itemIcon.setDepth(1001);
        
        this.itemKeyText = this.add.text(itemX + weaponSlotSize/2, itemY + weaponSlotSize - 8, 'E', {
            fontSize: '14px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        this.itemKeyText.setOrigin(0.5, 1);
        this.itemKeyText.setScrollFactor(0);
        this.itemKeyText.setDepth(1001);
        
        this.itemCountText = this.add.text(itemX + weaponSlotSize - 5, itemY + 5, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 3, y: 1 }
        });
        this.itemCountText.setOrigin(1, 0);
        this.itemCountText.setScrollFactor(0);
        this.itemCountText.setDepth(1002);
        
        // 아이템 변경 안내 (아이템 슬롯 좌측)
        this.itemCycleText = this.add.text(itemX - 10, itemY + weaponSlotSize/2, 'Switch Item (Q)', {
            fontSize: '14px',
            color: '#cccccc',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        this.itemCycleText.setOrigin(1, 0.5); // 우측 정렬로 변경
        this.itemCycleText.setScrollFactor(0);
        this.itemCycleText.setDepth(1000);
        
        // 조준 표시 (플레이어 주변 회전 화살표)
        this.aimIndicator = this.add.graphics();
        this.aimIndicator.setDepth(100);
    }
    
    createPauseMenu() {
        this.pauseMenu = new PauseMenu(this);
        this.pauseMenu.create();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.physics.pause();
            this.pauseMenu.show();
        } else {
            this.physics.resume();
            this.pauseMenu.hide();
        }
    }
    
    update(time, delta) {
        if (this.gameEnded || this.shopUI.isOpen || this.isPaused) return;
        
        // Update timer
        GameState.timeElapsed = (Date.now() - this.gameStartTime) / 1000;
        const minutes = Math.floor(GameState.timeElapsed / 60);
        const seconds = Math.floor(GameState.timeElapsed % 60);
        this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        
        // Check win condition
        if (GameState.timeElapsed >= CONFIG.GAME.SURVIVAL_TIME) {
            this.endGame(true);
            return;
        }
        
        // Update player (조준 중이 아닐 때만 이동 가능)
        if (!this.weaponSystem.isAiming) {
            this.player.update(this.input.activePointer);
        } else {
            // 조준 중에는 이동 불가
            this.player.setVelocity(0, 0);
            // 조준선 그리기
            this.drawBombAimLine();
        }
        
        // Check if player died
        if (this.player.isDead()) {
            this.endGame(false);
            return;
        }
        
        // Update weapon system
        this.weaponSystem.update();
        
        // Update zombies
        this.zombieSpawner.update(time, delta, this.player, this.mapGenerator.obstacles);
        
        // Check collisions
        this.checkCollisions(time);
        
        // Update fog of war
        this.fogOfWar.update(this.player.x, this.player.y);
        
        // Check auto pickup
        this.itemManager.checkAutoPickup(this.player, this.weaponSystem);
        
        // Update HUD
        this.updateHUD();
        
        // Update aim indicator
        this.updateAimIndicator();
    }
    
    checkCollisions(time) {
        const zombies = this.zombieSpawner.getActiveZombies();
        
        // Player vs zombies
        zombies.forEach(zombie => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, zombie.x, zombie.y
            );
            
            if (distance < 30 && zombie.canAttack(time)) {
                const damage = zombie.attack(time);
                this.player.takeDamage(damage);
            }
        });
        
        // Projectiles vs zombies
        this.weaponSystem.projectiles.children.entries.forEach(projectile => {
            if (!projectile.active) return;
            
            zombies.forEach(zombie => {
                const distance = Phaser.Math.Distance.Between(
                    projectile.x, projectile.y, zombie.x, zombie.y
                );
                
                if (distance < 20) {
                    const died = zombie.takeDamage(projectile.damage);
                    projectile.deactivate();
                    
                    if (died) {
                        this.handleZombieDeath(zombie);
                    }
                }
            });
        });
        
        // Melee attacks vs zombies
        if (this.weaponSystem.currentMeleeHitbox) {
            const hitbox = this.weaponSystem.currentMeleeHitbox;
            
            zombies.forEach(zombie => {
                const distance = Phaser.Math.Distance.Between(
                    hitbox.x, hitbox.y, zombie.x, zombie.y
                );
                
                if (distance <= hitbox.range) {
                    // Check if zombie is within arc
                    const angleToZombie = Phaser.Math.Angle.Between(
                        hitbox.x, hitbox.y, zombie.x, zombie.y
                    );
                    const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToZombie - hitbox.angle));
                    
                    if (angleDiff <= hitbox.arcAngle / 2) {
                        const died = zombie.takeDamage(hitbox.damage);
                        
                        if (died) {
                            this.handleZombieDeath(zombie);
                        }
                    }
                }
            });
        }
        
        // Bombs vs zombies and player
        this.weaponSystem.bombs.children.entries.forEach(bomb => {
            if (!bomb.hasExploded) return;
            
            const explosionRadius = CONFIG.WEAPONS.BOMB.explosionRadius;
            const explosionX = bomb.explosionX || bomb.x;
            const explosionY = bomb.explosionY || bomb.y;
            
            // Damage zombies (100% damage)
            zombies.forEach(zombie => {
                const distance = Phaser.Math.Distance.Between(
                    explosionX, explosionY, zombie.x, zombie.y
                );
                
                if (distance <= explosionRadius) {
                    const died = zombie.takeDamage(CONFIG.WEAPONS.BOMB.damage);
                    
                    if (died) {
                        this.handleZombieDeath(zombie);
                    }
                }
            });
            
            // Damage player (30% damage)
            const playerDistance = Phaser.Math.Distance.Between(
                explosionX, explosionY, this.player.x, this.player.y
            );
            
            if (playerDistance <= explosionRadius) {
                const playerDamage = Math.floor(CONFIG.WEAPONS.BOMB.damage * 0.3);
                this.player.takeDamage(playerDamage);
            }
            
            // 데미지 처리 완료 후 플래그 초기화
            bomb.hasExploded = false;
        });
        
        // Zombie projectiles vs player
        zombies.forEach(zombie => {
            if (!zombie.projectiles) return;
            
            zombie.projectiles.forEach(projectile => {
                if (!projectile.active) return;
                
                const distance = Phaser.Math.Distance.Between(
                    projectile.x, projectile.y, this.player.x, this.player.y
                );
                
                if (distance < 20) {
                    this.player.takeDamage(projectile.damage);
                    projectile.active = false;
                    projectile.graphics.destroy();
                }
            });
        });
    }
    
    handleZombieDeath(zombie) {
        const coinValue = zombie.die();
        
        // 통계 업데이트
        GameState.zombiesKilled.total++;
        GameState.zombiesKilled[zombie.zombieType]++;
        GameState.totalCoinsEarned += coinValue;
        
        // Drop coin
        this.itemManager.dropCoin(zombie.x, zombie.y, coinValue);
        
        // Random item drop based on difficulty
        const difficulty = CONFIG.DIFFICULTIES[GameState.selectedDifficulty];
        if (Math.random() < difficulty.dropRate) {
            const itemTypes = ['HEAL_POTION', 'SPEED_BUFF', 'POWER_BUFF', 'VISION', 'ARROWS'];
            const randomItem = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            this.itemManager.dropItem(zombie.x, zombie.y, randomItem);
        }
        
        this.zombieSpawner.removeZombie(zombie);
    }
    
    updateHUD() {
        // Update coins
        this.coinsText.setText(`Coins: ${GameState.coins}`);
        
        // HP Bar는 플레이어 update에서 처리됨
        
        // Update weapon slots
        this.weaponSlots.forEach((weaponSlot, index) => {
            const isSelected = this.weaponSystem.currentWeapon === weaponSlot.weaponId;
            
            // Highlight selected weapon
            if (isSelected) {
                weaponSlot.slot.setStrokeStyle(4, 0xffff00);
                weaponSlot.slot.setFillStyle(0x4a3520);
            } else {
                weaponSlot.slot.setStrokeStyle(3, 0x8b6f47);
                weaponSlot.slot.setFillStyle(0x2d2d2d);
            }
            
            // Update ammo for bow
            if (weaponSlot.ammoText) {
                const bowWeapon = this.weaponSystem.weapons.bow;
                weaponSlot.ammoText.setText(bowWeapon.ammo.toString());
            }
        });
        
        // Update item slot
        if (this.itemManager.inventory.length > 0) {
            const currentItem = this.itemManager.inventory[0];
            const itemConfig = CONFIG.ITEMS[currentItem];
            this.itemIcon.setText(itemConfig.name);
            
            // Count same items in inventory
            const count = this.itemManager.inventory.filter(i => i === currentItem).length;
            this.itemCountText.setText(count > 1 ? count.toString() : '');
        } else {
            this.itemIcon.setText('');
            this.itemCountText.setText('');
        }
    }
    
    drawBombAimLine() {
        this.weaponSystem.aimGraphics.clear();
        
        const pointer = this.input.activePointer;
        const startX = this.player.x;
        const startY = this.player.y;
        const endX = pointer.worldX;
        const endY = pointer.worldY;
        
        // 조준선 그리기
        this.weaponSystem.aimGraphics.lineStyle(3, 0xff0000, 0.8);
        this.weaponSystem.aimGraphics.beginPath();
        this.weaponSystem.aimGraphics.moveTo(startX, startY);
        this.weaponSystem.aimGraphics.lineTo(endX, endY);
        this.weaponSystem.aimGraphics.strokePath();
        
        // 착탄 지점 표시
        this.weaponSystem.aimGraphics.fillStyle(0xff0000, 0.3);
        this.weaponSystem.aimGraphics.fillCircle(endX, endY, CONFIG.WEAPONS.BOMB.explosionRadius);
        
        this.weaponSystem.aimGraphics.lineStyle(2, 0xff0000, 0.6);
        this.weaponSystem.aimGraphics.strokeCircle(endX, endY, CONFIG.WEAPONS.BOMB.explosionRadius);
    }
    
    updateAimIndicator() {
        // 폭탄 조준 중이면 조준선만 표시
        if (this.weaponSystem.isAiming) {
            this.aimIndicator.clear();
            return;
        }
        
        this.aimIndicator.clear();
        
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.player.x, this.player.y,
            pointer.worldX, pointer.worldY
        );
        
        // Draw arrow pointing towards mouse
        const distance = 40; // Distance from player
        const arrowX = this.player.x + Math.cos(angle) * distance;
        const arrowY = this.player.y + Math.sin(angle) * distance;
        
        this.aimIndicator.fillStyle(0xffff00, 0.8);
        this.aimIndicator.lineStyle(2, 0xff0000, 1);
        
        // Draw triangle (arrow)
        const size = 8;
        const x1 = arrowX + Math.cos(angle) * size;
        const y1 = arrowY + Math.sin(angle) * size;
        const x2 = arrowX + Math.cos(angle + 2.5) * size;
        const y2 = arrowY + Math.sin(angle + 2.5) * size;
        const x3 = arrowX + Math.cos(angle - 2.5) * size;
        const y3 = arrowY + Math.sin(angle - 2.5) * size;
        
        this.aimIndicator.fillTriangle(x1, y1, x2, y2, x3, y3);
        this.aimIndicator.strokeTriangle(x1, y1, x2, y2, x3, y3);
    }
    
    endGame(victory) {
        if (this.gameEnded) return;
        
        this.gameEnded = true;
        GameState.score = GameState.totalCoinsEarned; // 총 획득 코인으로 변경
        
        // Update high score
        if (GameState.score > GameState.highScore) {
            GameState.highScore = GameState.score;
            localStorage.setItem('kingdomZombieHighScore', GameState.highScore.toString());
        }
        
        // Transition to end scene
        this.time.delayedCall(500, () => {
            this.scene.start('EndScene', { victory });
        });
    }
    
    shutdown() {
        // Cleanup
        if (this.player) this.player.cleanup();
        if (this.zombieSpawner) this.zombieSpawner.clear();
        if (this.itemManager) this.itemManager.clear();
        if (this.mapGenerator) this.mapGenerator.clear();
        if (this.fogOfWar) this.fogOfWar.destroy();
    }
}

// End Scene
class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }
    
    init(data) {
        this.victory = data.victory;
    }
    
    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x1a1a1a)
            .setOrigin(0);
        
        // Result title
        const title = this.add.text(centerX, centerY - 250, 
            this.victory ? 'Victory!' : 'Defeated', {
            fontSize: '48px',
            color: this.victory ? '#00ff00' : '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        
        // Stats
        const minutes = Math.floor(GameState.timeElapsed / 60);
        const seconds = Math.floor(GameState.timeElapsed % 60);
        const timeText = `Survival Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 좀비 킬 통계
        const zombieNames = {
            'REGULAR': 'Zombie',
            'TANK': 'Tank',
            'SPEED': 'Speed',
            'BERSERKER': 'Berserker',
            'SHOOTER': 'Shooter'
        };
        
        let zombieStats = `\nZombies Killed: ${GameState.zombiesKilled.total}\n`;
        zombieStats += `  - ${zombieNames.REGULAR}: ${GameState.zombiesKilled.REGULAR}\n`;
        zombieStats += `  - ${zombieNames.TANK}: ${GameState.zombiesKilled.TANK}\n`;
        zombieStats += `  - ${zombieNames.SPEED}: ${GameState.zombiesKilled.SPEED}\n`;
        zombieStats += `  - ${zombieNames.BERSERKER}: ${GameState.zombiesKilled.BERSERKER}\n`;
        zombieStats += `  - ${zombieNames.SHOOTER}: ${GameState.zombiesKilled.SHOOTER}`;
        
        const stats = this.add.text(centerX, centerY - 100, 
            `${timeText}\nTotal Coins Earned: ${GameState.score}${zombieStats}\n\nHigh Score: ${GameState.highScore} Coins`, {
            fontSize: '18px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 8
        });
        stats.setOrigin(0.5);
        
        // New high score
        if (GameState.score === GameState.highScore && GameState.score > 0) {
            const newRecord = this.add.text(centerX, centerY + 120, '★ New Record! ★', {
                fontSize: '28px',
                color: '#ffd700',
                fontStyle: 'bold'
            });
            newRecord.setOrigin(0.5);
            
            this.tweens.add({
                targets: newRecord,
                scale: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Restart button
        const restartButton = this.add.rectangle(centerX, centerY + 200, 300, 60, 0x4a3520);
        restartButton.setStrokeStyle(3, 0x8b6f47);
        restartButton.setInteractive({ useHandCursor: true });
        
        const restartText = this.add.text(centerX, centerY + 200, 'Restart', {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        restartText.setOrigin(0.5);
        
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x6a5530);
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x4a3520);
        });
        
        restartButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}

// ============================================
// PHASER GAME CONFIG
// ============================================

const gameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, EndScene]
};

// Start the game
const game = new Phaser.Game(gameConfig);
