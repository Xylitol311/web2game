// ============================================
// FOG OF WAR SYSTEM
// ============================================

class FogOfWar {
    constructor(scene) {
        this.scene = scene;
        this.graphics = null;
        this.maskGraphics = null;
        this.visionRadius = 160;
    }
    
    create() {
        // Create fog layer (black overlay)
        this.graphics = this.scene.add.graphics();
        this.graphics.setDepth(50); // Above game objects but below HUD
        this.graphics.setScrollFactor(0); // Fixed to camera
        
        // Create mask graphics for the circular vision
        this.maskGraphics = this.scene.make.graphics({}, false);
        
        // Set initial vision radius based on difficulty
        const difficulty = CONFIG.DIFFICULTIES[GameState.selectedDifficulty];
        this.visionRadius = difficulty.visionRadius + GameState.visionBonus;
    }
    
    update(playerX, playerY) {
        if (!this.graphics) return;
        
        // Clear previous drawings
        this.graphics.clear();
        
        // Get camera position
        const camera = this.scene.cameras.main;
        const screenWidth = camera.width;
        const screenHeight = camera.height;
        
        // Convert player world position to screen position
        const screenX = playerX - camera.scrollX;
        const screenY = playerY - camera.scrollY;
        
        // Create radial gradient effect manually
        // We'll draw the fog OUTSIDE the vision circle, not inside
        
        // Draw fog in 4 rectangles around the vision circle
        // Top
        this.graphics.fillStyle(0x000000, 0.9);
        this.graphics.fillRect(0, 0, screenWidth, Math.max(0, screenY - this.visionRadius));
        
        // Bottom
        this.graphics.fillRect(0, screenY + this.visionRadius, screenWidth, screenHeight);
        
        // Left
        this.graphics.fillRect(0, Math.max(0, screenY - this.visionRadius), 
                              Math.max(0, screenX - this.visionRadius), 
                              this.visionRadius * 2);
        
        // Right
        this.graphics.fillRect(screenX + this.visionRadius, Math.max(0, screenY - this.visionRadius), 
                              screenWidth, this.visionRadius * 2);
        
        // Draw gradient fade around the vision circle
        const fadeSteps = 15;
        for (let i = 0; i < fadeSteps; i++) {
            const ratio = i / fadeSteps; // 0 to 1
            const currentRadius = this.visionRadius + (i * 10); // Expand outward
            const alpha = 0.9 * (1 - ratio); // Start at 0.9, fade to 0
            
            if (alpha > 0.05) {
                this.graphics.lineStyle(10, 0x000000, alpha);
                this.graphics.strokeCircle(screenX, screenY, currentRadius);
            }
        }
    }
    
    createRadialGradient(x, y, radius) {
        // Helper for creating radial gradient effect
        // Phaser doesn't support canvas gradients directly in Graphics
        // So we use multiple circles with varying alpha
        return { x, y, radius };
    }
    
    increaseVision(amount) {
        this.visionRadius += amount;
        GameState.visionBonus += amount;
    }
    
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
        if (this.maskGraphics) {
            this.maskGraphics.destroy();
        }
    }
}
