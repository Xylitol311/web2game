// ============================================
// GAME CONFIGURATION
// ============================================

const CONFIG = {
    // World settings
    WORLD_SIZE: 1600, // 50 tiles * 32px
    TILE_SIZE: 32,
    GRID_SIZE: 50,
    
    // Player settings
    PLAYER_SPEED: 200,
    PLAYER_START_HP: 100,
    PLAYER_INVINCIBILITY_TIME: 500, // ms
    
    // Difficulty settings
    DIFFICULTIES: {
        EASY: {
            regularZombies: 120, // doubled from 60
            specialZombies: 20, // doubled from 10
            dropRate: 0.20,
            visionRadius: 256, // 8 units * 32px (5 + 3)
            label: 'Easy',
            spawnInterval: 8000,
            spawnCount: 3 // 1.5x from 2
        },
        NORMAL: {
            regularZombies: 180, // doubled from 90
            specialZombies: 40, // doubled from 20
            dropRate: 0.12,
            visionRadius: 256, // 8 units * 32px
            label: 'Normal',
            spawnInterval: 6000,
            spawnCount: 5 // 1.5x from 3 (rounded)
        },
        HELL: {
            regularZombies: 240, // doubled from 120
            specialZombies: 60, // doubled from 30
            dropRate: 0.05,
            visionRadius: 192, // 6 units * 32px (3 + 3)
            label: 'Hell',
            spawnInterval: 4000,
            spawnCount: 6 // 1.5x from 4
        }
    },
    
    // Weapon configurations
    WEAPONS: {
        BOW: {
            id: 'bow',
            name: 'Bow',
            damage: 7,
            critDamage: 10,
            critChance: 0.1,
            fireRate: 500, // ms
            projectileSpeed: 400,
            startAmmo: 10,
            reloadTime: 1500, // ms
            range: 600,
            type: 'ranged'
        },
        SPEAR: {
            id: 'spear',
            name: 'Spear',
            damage: 10,
            cooldown: 500, // ms
            range: 80,
            angle: 60, // cone angle in degrees
            type: 'melee'
        },
        SWORD: {
            id: 'sword',
            name: 'Sword',
            damage: 10,
            cooldown: 300, // ms
            range: 50,
            angle: 90, // arc angle in degrees
            type: 'melee'
        },
        BOMB: {
            id: 'bomb',
            name: 'Bomb',
            damage: 20,
            selfDamage: 10,
            cooldown: 5000, // ms
            range: 200, // throw range
            explosionRadius: 96,
            fuseTime: 1000, // ms
            type: 'throwable'
        }
    },
    
    // Item configurations
    ITEMS: {
        HEAL_POTION: {
            id: 'heal',
            name: 'Heal Potion',
            healAmount: 40,
            cooldown: 5000,
            price: 30 // halved from 60
        },
        SPEED_BUFF: {
            id: 'speed',
            name: 'Speed Buff',
            multiplier: 1.2,
            duration: 5000,
            cooldown: 5000,
            price: 20 // halved from 40
        },
        POWER_BUFF: {
            id: 'power',
            name: 'Power Buff',
            multiplier: 1.2,
            duration: 5000,
            cooldown: 5000,
            price: 20 // halved from 40
        },
        VISION: {
            id: 'vision',
            name: 'Vision',
            radiusIncrease: 32, // 1 unit
            maxStacks: 3,
            price: 35 // halved from 70
        },
        ARROWS: {
            id: 'arrows',
            name: 'Arrows',
            amount: 10, // 5-10 random
            price: 13 // halved from 25 (rounded)
        },
        CLOAK: {
            id: 'cloak',
            name: 'Cloak',
            damageReduction: 0.3,
            price: 75, // halved from 150
            oneTime: true
        },
        BOMB_ITEM: {
            id: 'bomb_item',
            name: 'Bomb',
            price: 40 // halved from 80
        }
    },
    
    // Zombie configurations
    ZOMBIES: {
        REGULAR: {
            type: 'regular',
            name: '일반 좀비',
            hp: 20,
            speed: 50,
            attackCooldown: 1000,
            damage: 10,
            coinDrop: 5,
            color: 0x4a7c4e, // green
            scale: 1.0
        },
        TANK: {
            type: 'tank',
            name: '탱크 좀비',
            hp: 50,
            speed: 35,
            attackCooldown: 1500,
            damage: 12,
            coinDrop: 15,
            color: 0xc44536, // red
            scale: 1.4,
            special: true
        },
        SPEED: {
            type: 'speed',
            name: '빠른 좀비',
            hp: 10,
            speed: 75,
            attackCooldown: 700,
            damage: 7,
            coinDrop: 10,
            color: 0x4a7ba7, // blue
            scale: 0.8,
            special: true
        },
        BERSERKER: {
            type: 'berserker',
            name: '광전사 좀비',
            hp: 25,
            speed: 55,
            attackCooldown: 1000,
            damage: 20,
            coinDrop: 20,
            color: 0x8b4789, // purple
            scale: 1.2,
            special: true
        },
        SHOOTER: {
            type: 'shooter',
            name: '원거리 좀비',
            hp: 15,
            speed: 40,
            attackCooldown: 2000,
            damage: 6,
            coinDrop: 12,
            projectileDamage: 6,
            projectileRange: 160,
            color: 0xd4a944, // yellow
            scale: 1.0,
            special: true
        }
    },
    
    // Spawn settings
    SPAWN: {
        MIN_INTERVAL: 2000, // ms
        MAX_INTERVAL: 5000, // ms
        SPECIAL_CHANCE: 0.2, // 20% chance for special zombie
        EDGE_MARGIN: 100 // spawn distance from edge
    },
    
    // Map settings
    MAP: {
        OBSTACLES: 100, // trees and rocks
        BUILDINGS: 5, // 5-10 range
        SHOPS: 2, // always 2 shops
        MIN_DISTANCE: 80 // minimum distance between objects
    },
    
    // Game settings
    GAME: {
        SURVIVAL_TIME: 120, // seconds (2 minutes)
        AUTO_PICKUP_RADIUS: 40,
        MAX_ITEM_SLOTS: 5
    },
    
    // Colors
    COLORS: {
        GRASS: 0x5a7c3e,
        TREE: 0x3d5a27,
        ROCK: 0x6b6b6b,
        BUILDING: 0x8b6f47,
        SHOP: 0xd4a944,
        ESCAPE: 0x4a9d4a,
        COIN: 0xffd700,
        FOG: 0x000000
    }
};

// Global game state
const GameState = {
    difficulty: null,
    selectedDifficulty: 'NORMAL',
    coins: 0,
    score: 0,
    highScore: 0,
    timeElapsed: 0,
    hasCloak: false,
    visionBonus: 0,
    // Statistics
    totalCoinsEarned: 0, // total coins earned
    zombiesKilled: {
        total: 0,
        REGULAR: 0,
        TANK: 0,
        SPEED: 0,
        BERSERKER: 0,
        SHOOTER: 0
    }
};

// Load high score from localStorage
if (localStorage.getItem('kingdomZombieHighScore')) {
    GameState.highScore = parseInt(localStorage.getItem('kingdomZombieHighScore'));
}
