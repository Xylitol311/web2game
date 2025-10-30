// ============================================
// 메인 게임 루프 및 제어
// ============================================

const Game = {
    // 게임 상태
    state: 'intro',  // 'intro', 'playing', 'ended'
    
    // 타이머
    startTime: 0,
    elapsedTime: 0,
    
    // 오디오 컨텍스트
    audioContext: null,
    
    // DOM 요소
    elements: {
        intro: null,
        endScreen: null,
        gameUI: null,
        startBtn: null,
        restartBtn: null,
        timerDisplay: null,
        heightDisplay: null,
        scoreDisplay: null,
        hookIndicator: null
    },
    
    // ============================================
    // 초기화
    // ============================================
    init() {
        // DOM 요소 가져오기
        this.elements.intro = document.getElementById('intro');
        this.elements.endScreen = document.getElementById('endScreen');
        this.elements.gameUI = document.getElementById('gameUI');
        this.elements.startBtn = document.getElementById('startBtn');
        this.elements.restartBtn = document.getElementById('restartBtn');
        this.elements.timerDisplay = document.getElementById('timerDisplay');
        this.elements.heightDisplay = document.getElementById('heightDisplay');
        this.elements.scoreDisplay = document.getElementById('scoreDisplay');
        this.elements.hookIndicator = document.getElementById('hookIndicator');
        
        // Canvas 초기화
        const canvas = document.getElementById('gameCanvas');
        Renderer.init(canvas);
        
        // 지형 초기화
        Terrain.init();
        
        // 로봇 초기화
        Robot.init();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 오디오 초기화
        this.initAudio();
        
        // 게임 루프 시작
        this.gameLoop();
    },
    
    // ============================================
    // 이벤트 리스너
    // ============================================
    setupEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        
        // 시작 버튼
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        
        // 재시작 버튼
        this.elements.restartBtn.addEventListener('click', () => this.restartGame());
        
        // 마우스 클릭 (후크 고정/해제)
        let isMouseDown = false;
        
        canvas.addEventListener('mousedown', (e) => {
            if (this.state !== 'playing') return;
            isMouseDown = true;
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = mouseX;
            const worldY = mouseY + Renderer.cameraY;
            
            // 후크 상태가 아니면 후크 시도
            if (!Robot.hook.active) {
                Robot.updateArmAngle(worldX, worldY);
                Robot.tryHook();
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (this.state !== 'playing') return;
            isMouseDown = false;
            
            // 후크 해제
            if (Robot.hook.active) {
                Robot.releaseHook();
            }
        });
        
        // 마우스 이동 (팔 또는 몫 조종)
        canvas.addEventListener('mousemove', (e) => {
            if (this.state !== 'playing') return;
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 월드 좌표로 변환 (카메라 오프셋 적용)
            const worldX = mouseX;
            const worldY = mouseY + Renderer.cameraY;
            
            Robot.updateMousePosition(worldX, worldY);
            
            // 후크 상태가 아니고 마우스를 누르고 있지 않으면 팔 각도만 변경
            if (!Robot.hook.active && !isMouseDown) {
                Robot.updateArmAngle(worldX, worldY);
            }
        });
        
        // 터치 지원 (모바일)
        canvas.addEventListener('touchmove', (e) => {
            if (this.state !== 'playing') return;
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const mouseX = touch.clientX - rect.left;
            const mouseY = touch.clientY - rect.top;
            
            const worldX = mouseX;
            const worldY = mouseY + Renderer.cameraY;
            
            Robot.updateArmAngle(worldX, worldY);
        }, { passive: false });
    },
    
    // ============================================
    // 게임 시작/종료
    // ============================================
    startGame() {
        // 인트로 숨기기
        this.elements.intro.classList.add('fade-out');
        setTimeout(() => {
            this.elements.intro.style.display = 'none';
        }, 500);
        
        // UI 표시
        this.elements.gameUI.style.display = 'block';
        
        // 게임 상태 초기화
        this.state = 'playing';
        this.startTime = Date.now();
        this.elapsedTime = 0;
        
        // 로봇 초기화
        Robot.init();
        
        // 사운드 재생
        this.playSound(440, 100);
    },
    
    endGame(won) {
        this.state = 'ended';
        
        // 최종 시간
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        
        // 엔드 스크린 설정
        const endTitle = document.getElementById('endTitle');
        const endScore = document.getElementById('endScore');
        const endHeight = document.getElementById('endHeight');
        const endTime = document.getElementById('endTime');
        
        if (won) {
            endTitle.textContent = '🎉 클리어!';
            endTitle.style.color = '#4CAF50';
            this.playSound(523, 200);  // C5
            setTimeout(() => this.playSound(659, 200), 200);  // E5
            setTimeout(() => this.playSound(784, 300), 400);  // G5
        } else {
            endTitle.textContent = '⏰ 시간 초과!';
            endTitle.style.color = '#FF6B6B';
            this.playSound(220, 300);
        }
        
        const score = Robot.getScore();
        const heightPercent = Math.floor(((Robot.stats.startY - Robot.stats.maxHeight) / (Robot.stats.startY - 40)) * 100);
        
        endScore.textContent = `점수: ${score}`;
        endHeight.textContent = `최고 높이: ${Math.max(0, heightPercent)}%`;
        
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        endTime.textContent = `소요 시간: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // UI 숨기기
        this.elements.gameUI.style.display = 'none';
        
        // 엔드 스크린 표시
        this.elements.endScreen.style.display = 'flex';
        this.elements.endScreen.classList.add('fade-in');
    },
    
    restartGame() {
        // 엔드 스크린 숨기기
        this.elements.endScreen.style.display = 'none';
        this.elements.endScreen.classList.remove('fade-in');
        
        // 게임 재시작
        this.startGame();
    },
    
    // ============================================
    // 게임 루프
    // ============================================
    gameLoop() {
        // 업데이트
        if (this.state === 'playing') {
            this.update();
        }
        
        // 렌더링
        this.render();
        
        // 다음 프레임
        requestAnimationFrame(() => this.gameLoop());
    },
    
    update() {
        // 로봇 업데이트
        Robot.update();
        
        // 카메라 업데이트
        Renderer.updateCamera(Robot.body.y);
        
        // UI 업데이트
        this.updateUI();
        
        // 목표 도달 체크
        if (Robot.hasReachedGoal()) {
            this.endGame(true);
        }
        
        // 타임아웃 체크 (5분)
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        if (this.elapsedTime > 300) {  // 5분
            this.endGame(false);
        }
        
        // 후크 인디케이터 업데이트
        if (Robot.hook.active) {
            this.elements.hookIndicator.classList.add('active');
        } else {
            this.elements.hookIndicator.classList.remove('active');
        }
    },
    
    render() {
        Renderer.render();
    },
    
    // ============================================
    // UI 업데이트
    // ============================================
    updateUI() {
        // 타이머
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        this.elements.timerDisplay.textContent = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 높이
        const heightPercent = Robot.getHeightPercent();
        this.elements.heightDisplay.textContent = `📏 높이: ${heightPercent}%`;
        
        // 점수
        const score = Robot.getScore();
        this.elements.scoreDisplay.textContent = `⭐ 점수: ${score}`;
    },
    
    // ============================================
    // 사운드 시스템
    // ============================================
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },
    
    playSound(frequency, duration) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (e) {
            // 사운드 재생 실패 무시
        }
    }
};

// ============================================
// 게임 시작
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
