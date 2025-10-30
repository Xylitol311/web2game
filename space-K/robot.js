// ============================================
// 로봇 및 팔 컨트롤 모듈
// Getting Over It 스타일의 360도 팔 조작
// ============================================

const Robot = {
    // 로봇 몸체
    body: {
        x: 150,
        y: 550,
        radius: 20,
        vx: 0,
        vy: 0,
        rotation: 0  // 몸체 회전
    },
    
    // 팔
    arm: {
        length: 100,
        angle: -Math.PI / 2,  // 초기 각도 (위쪽)
        tipX: 0,
        tipY: 0
    },
    
    // 후크 상태
    hook: {
        active: false,
        x: 0,
        y: 0,
        obstacle: null
    },
    
    // 마우스 상태
    mouse: {
        x: 0,
        y: 0,
        worldX: 0,
        worldY: 0
    },
    
    // 통계
    stats: {
        maxHeight: 550,
        startY: 550
    },
    
    // ============================================
    // 초기화
    // ============================================
    init() {
        this.body.x = 150;
        this.body.y = 550;
        this.body.vx = 0;
        this.body.vy = 0;
        this.body.rotation = 0;
        this.arm.angle = -Math.PI / 2;
        this.hook.active = false;
        this.stats.maxHeight = 550;
        this.stats.startY = 550;
        this.updateArmTip();
    },
    
    // ============================================
    // 팔 업데이트
    // ============================================
    
    // 팔 끝 위치 계산
    updateArmTip() {
        // 후크 상태면 팔 끝은 후크 포인트에 고정
        if (this.hook.active) {
            this.arm.tipX = this.hook.x;
            this.arm.tipY = this.hook.y;
            // 팔 각도도 후크 포인트 방향으로 업데이트
            const dx = this.hook.x - this.body.x;
            const dy = this.hook.y - this.body.y;
            this.arm.angle = Math.atan2(dy, dx);
        } else {
            this.arm.tipX = this.body.x + Math.cos(this.arm.angle) * this.arm.length;
            this.arm.tipY = this.body.y + Math.sin(this.arm.angle) * this.arm.length;
        }
    },
    
    // 마우스 위치 업데이트
    updateMousePosition(mouseWorldX, mouseWorldY) {
        this.mouse.worldX = mouseWorldX;
        this.mouse.worldY = mouseWorldY;
    },
    
    // 마우스 위치로 팔 각도 설정 (360도)
    updateArmAngle(mouseWorldX, mouseWorldY) {
        this.mouse.worldX = mouseWorldX;
        this.mouse.worldY = mouseWorldY;
        
        // 후크 상태가 아닐 때만 팔 각도 변경
        if (!this.hook.active) {
            const dx = mouseWorldX - this.body.x;
            const dy = mouseWorldY - this.body.y;
            this.arm.angle = Math.atan2(dy, dx);
        }
        
        this.updateArmTip();
    },
    
    // ============================================
    // 후크 시스템
    // ============================================
    
    // 후크 시도
    tryHook() {
        const collision = Terrain.checkArmCollision(this.arm.tipX, this.arm.tipY);
        
        if (collision.collided) {
            this.hook.active = true;
            this.hook.x = collision.hookX;
            this.hook.y = collision.hookY;
            this.hook.obstacle = collision.obstacle;
            return true;
        } else {
            this.hook.active = false;
            return false;
        }
    },
    
    // 후크 해제
    releaseHook() {
        this.hook.active = false;
        this.hook.obstacle = null;
    },
    
    // ============================================
    // 물리 업데이트
    // ============================================
    
    update(deltaTime = 1) {
        // 팔 끝 위치 업데이트
        this.updateArmTip();
        
        if (this.hook.active) {
            // 후크 상태 - 마우스로 몫 직접 조종
            
            // 마우스 방향으로 몫을 이동 (후크 포인트 기준)
            const toMouseX = this.mouse.worldX - this.hook.x;
            const toMouseY = this.mouse.worldY - this.hook.y;
            const toMouseDist = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY);
            
            if (toMouseDist > 0) {
                // 팔 길이 내에서 마우스 방향으로 몫 이동
                const targetDist = Math.min(toMouseDist, this.arm.length);
                const dirX = toMouseX / toMouseDist;
                const dirY = toMouseY / toMouseDist;
                
                const targetX = this.hook.x + dirX * targetDist;
                const targetY = this.hook.y + dirY * targetDist;
                
                // 몫을 목표 위치로 부드럽게 이동 (관성 유지)
                const moveSpeed = 0.3;
                const dx = targetX - this.body.x;
                const dy = targetY - this.body.y;
                
                // 속도 계산 (관성)
                this.body.vx += dx * moveSpeed;
                this.body.vy += dy * moveSpeed;
                
                // 중력 적용 (약하게)
                this.body.vy += Physics.GRAVITY * 0.3;
            }
            
            // 감쇠
            this.body.vx *= 0.85;
            this.body.vy *= 0.85;
            
        } else {
            // 자유 낙하 상태 - 관성 유지
            
            // 중력 적용
            Physics.applyGravity(this.body);
            
            // 공기 저항
            Physics.applyAirResistance(this.body);
        }
        
        // 위치 업데이트
        Physics.updatePosition(this.body);
        
        // 지형 충돌 처리 (여러 번 반복하여 완전히 해결)
        for (let i = 0; i < 5; i++) {
            this.handleTerrainCollision();
        }
        
        // 화면 경계 체크
        this.checkBounds();
        
        // 최고 높이 업데이트
        if (this.body.y < this.stats.maxHeight) {
            this.stats.maxHeight = this.body.y;
        }
        
        // 몫체 회전 업데이트 (속도 방향)
        if (Math.abs(this.body.vx) > 0.1 || Math.abs(this.body.vy) > 0.1) {
            const targetRotation = Math.atan2(this.body.vy, this.body.vx);
            this.body.rotation += (targetRotation - this.body.rotation) * 0.1;
        }
    },
    
    // ============================================
    // 충돌 처리
    // ============================================
    
    handleTerrainCollision() {
        const collisions = Terrain.checkBodyCollision(
            this.body.x, 
            this.body.y, 
            this.body.radius
        );
        
        // 모든 충돌 해결
        for (let collision of collisions) {
            // 충돌 속도 계산
            const speed = Math.sqrt(this.body.vx * this.body.vx + this.body.vy * this.body.vy);
            
            Physics.resolveCollision(this.body, collision, collision.friction);
            
            // 빠른 속도로 충돌하면 바운스
            if (speed > 5) {
                // 추가 반발
                const normalVel = Physics.dot(this.body.vx, this.body.vy, collision.normalX, collision.normalY);
                if (normalVel < 0) {
                    this.body.vx -= collision.normalX * normalVel * 0.3;
                    this.body.vy -= collision.normalY * normalVel * 0.3;
                }
            }
            
            // 미끄러짐 체크
            if (Physics.isSliding(collision, collision.friction)) {
                // 경사면을 따라 미끄러지는 힘 추가
                const slideForce = Physics.GRAVITY * Math.sin(
                    Math.atan2(collision.normalX, -collision.normalY)
                );
                this.body.vx += collision.normalY * slideForce * 0.5;
                this.body.vy += -collision.normalX * slideForce * 0.5;
            } else if (speed < 1) {
                // 느린 속도에서 안정적인 표면이면 멈춤
                if (collision.normalY < -0.7) {  // 위를 향하는 표면
                    this.body.vx *= 0.5;
                    this.body.vy *= 0.5;
                }
            }
        }
    },
    
    // 화면 경계 체크
    checkBounds() {
        // 좌우 경계
        if (this.body.x < this.body.radius) {
            this.body.x = this.body.radius;
            this.body.vx = Math.abs(this.body.vx) * 0.5;
        }
        if (this.body.x > 800 - this.body.radius) {
            this.body.x = 800 - this.body.radius;
            this.body.vx = -Math.abs(this.body.vx) * 0.5;
        }
        
        // 아래로 떨어지면 (실패)
        if (this.body.y > 650) {
            // 시작 위치로 리셋
            this.body.x = 150;
            this.body.y = 550;
            this.body.vx = 0;
            this.body.vy = 0;
            this.hook.active = false;
        }
    },
    
    // ============================================
    // 게임 상태 체크
    // ============================================
    
    // 목표 도달 체크
    hasReachedGoal() {
        return Terrain.hasReachedGoal(this.body.y);
    },
    
    // 점수 계산
    getScore() {
        const heightClimbed = this.stats.startY - this.stats.maxHeight;
        const totalHeight = this.stats.startY - 40;  // 목표 높이
        return Math.floor((heightClimbed / totalHeight) * 10000);
    },
    
    // 높이 퍼센트
    getHeightPercent() {
        const heightClimbed = this.stats.startY - this.body.y;
        const totalHeight = this.stats.startY - 40;
        return Math.max(0, Math.min(100, Math.floor((heightClimbed / totalHeight) * 100)));
    }
};

// 전역으로 내보내기
window.Robot = Robot;
