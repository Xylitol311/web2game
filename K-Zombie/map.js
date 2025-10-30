// ============================================
// MAP GENERATION
// ============================================

class MapGenerator {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.buildings = [];
        this.shops = [];
    }
    
    generate() {
        this.createBackground();
        this.createObstacles();
        this.createBuildings();
        this.createShops();
    }
    
    createBackground() {
        // Grass background
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(CONFIG.COLORS.GRASS);
        graphics.fillRect(0, 0, CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE);
        graphics.setDepth(0);
        
        // Add some texture variation
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * CONFIG.WORLD_SIZE;
            const y = Math.random() * CONFIG.WORLD_SIZE;
            const shade = Math.random() > 0.5 ? 0x4a6b2e : 0x6a8b4e;
            graphics.fillStyle(shade, 0.3);
            graphics.fillRect(x, y, 10, 10);
        }
    }
    
    createObstacles() {
        const count = CONFIG.MAP.OBSTACLES;
        
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            
            // Find valid position
            do {
                x = Phaser.Math.Between(100, CONFIG.WORLD_SIZE - 100);
                y = Phaser.Math.Between(100, CONFIG.WORLD_SIZE - 100);
                attempts++;
            } while (attempts < 50 && !this.isValidPosition(x, y, 50));
            
            if (attempts >= 50) continue;
            
            // Random: tree or rock
            const isTree = Math.random() > 0.5;
            const obstacle = this.createObstacle(x, y, isTree);
            this.obstacles.push(obstacle);
        }
    }
    
    createObstacle(x, y, isTree) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(2);
        
        if (isTree) {
            // Tree
            graphics.fillStyle(0x4a3520); // trunk
            graphics.fillRect(x - 4, y - 8, 8, 16);
            
            graphics.fillStyle(CONFIG.COLORS.TREE);
            graphics.fillCircle(x, y - 16, 20);
            graphics.fillCircle(x - 10, y - 10, 15);
            graphics.fillCircle(x + 10, y - 10, 15);
        } else {
            // Rock
            graphics.fillStyle(CONFIG.COLORS.ROCK);
            graphics.fillEllipse(x, y, 30, 20);
            graphics.fillStyle(0x5a5a5a);
            graphics.fillEllipse(x - 5, y - 3, 10, 8);
        }
        
        // Physics body
        const body = this.scene.add.rectangle(x, y, 32, 32);
        this.scene.physics.add.existing(body, true); // static body
        body.setVisible(false);
        
        return { graphics, body, x, y };
    }
    
    createBuildings() {
        const count = Phaser.Math.Between(5, CONFIG.MAP.BUILDINGS);
        
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            
            do {
                x = Phaser.Math.Between(200, CONFIG.WORLD_SIZE - 200);
                y = Phaser.Math.Between(200, CONFIG.WORLD_SIZE - 200);
                attempts++;
            } while (attempts < 50 && !this.isValidPosition(x, y, 100));
            
            if (attempts >= 50) continue;
            
            const building = this.createBuilding(x, y);
            this.buildings.push(building);
        }
    }
    
    createBuilding(x, y) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(2);
        
        const width = 64;
        const height = 64;
        
        // Building body
        graphics.fillStyle(CONFIG.COLORS.BUILDING);
        graphics.fillRect(x - width/2, y - height/2, width, height);
        
        // Roof
        graphics.fillStyle(0x6b4f2f);
        graphics.fillTriangle(
            x - width/2 - 5, y - height/2,
            x + width/2 + 5, y - height/2,
            x, y - height/2 - 20
        );
        
        // Door
        graphics.fillStyle(0x4a3520);
        graphics.fillRect(x - 10, y + height/2 - 20, 20, 20);
        
        // Windows
        graphics.fillStyle(0x87ceeb, 0.7);
        graphics.fillRect(x - 20, y - 10, 12, 12);
        graphics.fillRect(x + 8, y - 10, 12, 12);
        
        // Physics body
        const body = this.scene.add.rectangle(x, y, width, height);
        this.scene.physics.add.existing(body, true);
        body.setVisible(false);
        
        return { graphics, body, x, y, width, height };
    }
    
    createShops() {
        const count = CONFIG.MAP.SHOPS; // always exact count
        
        for (let i = 0; i < count; i++) {
            let x, y;
            let attempts = 0;
            
            do {
                x = Phaser.Math.Between(300, CONFIG.WORLD_SIZE - 300);
                y = Phaser.Math.Between(300, CONFIG.WORLD_SIZE - 300);
                attempts++;
            } while (attempts < 100 && !this.isValidPosition(x, y, 150));
            
            // Force creation if attempts exceeded
            if (attempts >= 100) {
                x = Phaser.Math.Between(400, CONFIG.WORLD_SIZE - 400);
                y = Phaser.Math.Between(400, CONFIG.WORLD_SIZE - 400);
            }
            
            const shop = this.createShop(x, y);
            this.shops.push(shop);
        }
    }
    
    createShop(x, y) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(2);
        
        const width = 80;
        const height = 70;
        
        // Shop body (golden color)
        graphics.fillStyle(CONFIG.COLORS.SHOP);
        graphics.fillRect(x - width/2, y - height/2, width, height);
        
        // Roof
        graphics.fillStyle(0xb8860b);
        graphics.fillTriangle(
            x - width/2 - 5, y - height/2,
            x + width/2 + 5, y - height/2,
            x, y - height/2 - 25
        );
        
        // Sign
        graphics.fillStyle(0xffffff);
        graphics.fillRect(x - 25, y - height/2 + 10, 50, 20);
        
        // Text "Shop"
        const text = this.scene.add.text(x, y - height/2 + 20, 'Shop', {
            fontSize: '14px',
            color: '#000000',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setDepth(3);
        
        // Interaction indicator (always visible)
        const indicator = this.scene.add.text(x, y + height/2 + 10, 'Interact (F)', {
            fontSize: '12px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 2 }
        });
        indicator.setOrigin(0.5);
        indicator.setDepth(3);
        
        // Physics body
        const body = this.scene.add.rectangle(x, y, width, height);
        this.scene.physics.add.existing(body, true);
        body.setVisible(false);
        
        return { graphics, body, text, indicator, x, y, width, height, type: 'shop' };
    }
    
    
    isValidPosition(x, y, minDistance) {
        // Check distance from center (player spawn)
        const centerX = CONFIG.WORLD_SIZE / 2;
        const centerY = CONFIG.WORLD_SIZE / 2;
        if (Phaser.Math.Distance.Between(x, y, centerX, centerY) < 200) {
            return false;
        }
        
        // Check distance from other objects
        const allObjects = [...this.obstacles, ...this.buildings, ...this.shops];
        
        for (const obj of allObjects) {
            const distance = Phaser.Math.Distance.Between(x, y, obj.x, obj.y);
            if (distance < minDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    checkInteraction(player) {
        // Check shop interaction
        for (const shop of this.shops) {
            const distance = Phaser.Math.Distance.Between(
                player.x, player.y, shop.x, shop.y
            );
            
            if (distance < 80) {
                shop.indicator.setText('[F] Open Shop');
                shop.indicator.setVisible(true);
                return { type: 'shop', object: shop };
            } else {
                shop.indicator.setVisible(false);
            }
        }
        
        return null;
    }
    
    getObstacleBodies() {
        return this.obstacles.map(o => o.body).concat(
            this.buildings.map(b => b.body)
        ).concat(
            this.shops.map(s => s.body)
        );
    }
    
    clear() {
        this.obstacles.forEach(o => {
            if (o.graphics) o.graphics.destroy();
            if (o.body) o.body.destroy();
        });
        
        this.buildings.forEach(b => {
            if (b.graphics) b.graphics.destroy();
            if (b.body) b.body.destroy();
        });
        
        this.shops.forEach(s => {
            if (s.graphics) s.graphics.destroy();
            if (s.text) s.text.destroy();
            if (s.indicator) s.indicator.destroy();
            if (s.body) s.body.destroy();
        });
        
        this.obstacles = [];
        this.buildings = [];
        this.shops = [];
    }
}
