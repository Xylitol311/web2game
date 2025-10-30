// ============================================
// PAUSE MENU
// ============================================

class PauseMenu {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.elements = [];
    }
    
    create() {
        const camera = this.scene.cameras.main;
        const centerX = camera.width / 2;
        const centerY = camera.height / 2;
        
        // Overlay
        this.overlay = this.scene.add.rectangle(
            0, 0,
            camera.width, camera.height,
            0x000000, 0.8
        );
        this.overlay.setOrigin(0);
        this.overlay.setScrollFactor(0);
        this.overlay.setDepth(2000);
        this.overlay.setVisible(false);
        this.elements.push(this.overlay);
        
        // Panel
        this.panel = this.scene.add.rectangle(
            centerX, centerY,
            400, 350,
            0x2d1810
        );
        this.panel.setStrokeStyle(4, 0xd4a944);
        this.panel.setScrollFactor(0);
        this.panel.setDepth(2001);
        this.panel.setVisible(false);
        this.elements.push(this.panel);
        
        // Title
        this.title = this.scene.add.text(centerX, centerY - 130, 'Paused', {
            fontSize: '32px',
            color: '#d4a944',
            fontStyle: 'bold'
        });
        this.title.setOrigin(0.5);
        this.title.setScrollFactor(0);
        this.title.setDepth(2002);
        this.title.setVisible(false);
        this.elements.push(this.title);
        
        // Resume button
        this.resumeButton = this.createButton(centerX, centerY - 40, 'Resume', () => {
            this.scene.togglePause();
        });
        
        // Restart button
        this.restartButton = this.createButton(centerX, centerY + 40, 'Restart', () => {
            this.scene.scene.restart();
        });
        
        // Quit button
        this.quitButton = this.createButton(centerX, centerY + 120, 'Back to Menu', () => {
            this.scene.scene.start('MenuScene');
        });
    }
    
    createButton(x, y, text, callback) {
        const button = this.scene.add.rectangle(x, y, 300, 60, 0x4a3520);
        button.setStrokeStyle(3, 0x8b6f47);
        button.setScrollFactor(0);
        button.setDepth(2001);
        button.setVisible(false);
        button.setInteractive({ useHandCursor: true });
        
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        buttonText.setScrollFactor(0);
        buttonText.setDepth(2002);
        buttonText.setVisible(false);
        
        button.on('pointerover', () => {
            button.setFillStyle(0x6a5530);
        });
        
        button.on('pointerout', () => {
            button.setFillStyle(0x4a3520);
        });
        
        button.on('pointerdown', callback);
        
        this.elements.push(button, buttonText);
        
        return { button, text: buttonText };
    }
    
    show() {
        this.isVisible = true;
        this.elements.forEach(el => el.setVisible(true));
    }
    
    hide() {
        this.isVisible = false;
        this.elements.forEach(el => el.setVisible(false));
    }
    
    destroy() {
        this.elements.forEach(el => el.destroy());
        this.elements = [];
    }
}
