// ============================================
// 렌더링 모듈
// 게임 그래픽 렌더링
// ============================================

const Renderer = {
    canvas: null,
    ctx: null,
    cameraY: 0,
    targetCameraY: 0,
    
    // ============================================
    // 초기화
    // ============================================
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cameraY = 0;
        this.targetCameraY = 0;
    },
    
    // ============================================
    // 카메라 업데이트
    // ============================================
    updateCamera(targetY) {
        // 플레이어를 중앙에 유지 (부드러운 추적)
        this.targetCameraY = Math.max(0, targetY - 300);
        this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;
    },
    
    // ============================================
    // 메인 렌더링
    // ============================================
    render() {
        const ctx = this.ctx;
        
        // 배경 클리어
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, 800, 600);
        
        // 카메라 변환 적용
        ctx.save();
        ctx.translate(0, -this.cameraY);
        
        // 배경 요소
        this.drawBackground();
        
        // 목표 지점 (우주선)
        this.drawGoal();
        
        // 지형
        this.drawTerrain();
        
        // 로봇
        this.drawRobot();
        
        // 후크 시각화
        if (Robot.hook.active) {
            this.drawHookLine();
        }
        
        ctx.restore();
        
        // 디버그 정보 (옵션)
        // this.drawDebugInfo();
    },
    
    // ============================================
    // 배경 그리기
    // ============================================
    drawBackground() {
        const ctx = this.ctx;
        
        // 구름
        this.drawCloud(100, 100 + this.cameraY * 0.5);
        this.drawCloud(400, 200 + this.cameraY * 0.5);
        this.drawCloud(650, 150 + this.cameraY * 0.5);
        
        // 산 실루엣 (멀리)
        ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, 600);
        ctx.lineTo(200, 400 + this.cameraY * 0.3);
        ctx.lineTo(400, 500 + this.cameraY * 0.3);
        ctx.lineTo(600, 350 + this.cameraY * 0.3);
        ctx.lineTo(800, 450 + this.cameraY * 0.3);
        ctx.lineTo(800, 600);
        ctx.closePath();
        ctx.fill();
    },
    
    drawCloud(x, y) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ============================================
    // 목표 지점 그리기
    // ============================================
    drawGoal() {
        const ctx = this.ctx;
        const x = 675;
        const y = 20;
        
        // 우주선
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 40, y + 60);
        ctx.lineTo(x + 40, y + 60);
        ctx.closePath();
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 창문
        ctx.fillStyle = '#4FC3F7';
        ctx.beginPath();
        ctx.arc(x, y + 30, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 불꽃 효과
        const flameOffset = Math.sin(Date.now() / 100) * 5;
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.moveTo(x - 20, y + 60);
        ctx.lineTo(x - 15, y + 80 + flameOffset);
        ctx.lineTo(x - 10, y + 60);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 60);
        ctx.lineTo(x + 15, y + 80 + flameOffset);
        ctx.lineTo(x + 10, y + 60);
        ctx.closePath();
        ctx.fill();
        
        // 목표 텍스트
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 목표', x, y - 10);
    },
    
    // ============================================
    // 지형 그리기
    // ============================================
    drawTerrain() {
        const ctx = this.ctx;
        
        for (let obstacle of Terrain.obstacles) {
            if (obstacle.type === 'line') {
                this.drawLine(obstacle);
            } else if (obstacle.type === 'circle') {
                this.drawCircle(obstacle);
            }
        }
    },
    
    drawLine(obstacle) {
        const ctx = this.ctx;
        
        // 그림자
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(obstacle.x1 + 2, obstacle.y1 + 2);
        ctx.lineTo(obstacle.x2 + 2, obstacle.y2 + 2);
        ctx.stroke();
        
        // 메인
        ctx.strokeStyle = obstacle.color;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(obstacle.x1, obstacle.y1);
        ctx.lineTo(obstacle.x2, obstacle.y2);
        ctx.stroke();
        
        // 하이라이트
        ctx.strokeStyle = this.lightenColor(obstacle.color, 30);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(obstacle.x1, obstacle.y1);
        ctx.lineTo(obstacle.x2, obstacle.y2);
        ctx.stroke();
    },
    
    drawCircle(obstacle) {
        const ctx = this.ctx;
        
        // 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(obstacle.x + 3, obstacle.y + 3, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 메인
        ctx.fillStyle = obstacle.color;
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = this.darkenColor(obstacle.color, 30);
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 하이라이트 (입체감)
        const gradient = ctx.createRadialGradient(
            obstacle.x - obstacle.radius * 0.3,
            obstacle.y - obstacle.radius * 0.3,
            0,
            obstacle.x,
            obstacle.y,
            obstacle.radius
        );
        gradient.addColorStop(0, this.lightenColor(obstacle.color, 50));
        gradient.addColorStop(1, obstacle.color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 질감 (작은 점들)
        ctx.fillStyle = this.darkenColor(obstacle.color, 20);
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const dist = obstacle.radius * 0.6;
            const px = obstacle.x + Math.cos(angle) * dist;
            const py = obstacle.y + Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    // ============================================
    // 로봇 그리기
    // ============================================
    drawRobot() {
        const ctx = this.ctx;
        const robot = Robot.body;
        const arm = Robot.arm;
        
        ctx.save();
        ctx.translate(robot.x, robot.y);
        
        // 팔 그리기 (몸 뒤에)
        ctx.rotate(0);  // 팔은 절대 각도 사용
        this.drawArm();
        
        ctx.restore();
        
        // 몸 그리기
        ctx.save();
        ctx.translate(robot.x, robot.y);
        ctx.rotate(robot.rotation);
        this.drawBody();
        ctx.restore();
    },
    
    drawArm() {
        const ctx = this.ctx;
        const robot = Robot.body;
        const arm = Robot.arm;
        
        // 팔 끝 위치 (절대 좌표)
        const tipX = arm.tipX - robot.x;
        const tipY = arm.tipY - robot.y;
        
        // 팔 (굵은 선)
        ctx.strokeStyle = '#757575';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        
        // 팔 하이라이트
        ctx.strokeStyle = '#9E9E9E';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        
        // 팔 끝 (손/그래플)
        const isHooked = Robot.hook.active;
        ctx.fillStyle = isHooked ? '#FF6B6B' : '#9E9E9E';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = isHooked ? '#D32F2F' : '#616161';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 후크 상태 표시
        if (isHooked) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    drawBody() {
        const ctx = this.ctx;
        const radius = Robot.body.radius;
        
        // 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(2, 2, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 몸통 (원형)
        ctx.fillStyle = '#4FC3F7';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = '#0288D1';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 입체감
        const gradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, radius);
        gradient.addColorStop(0, '#81D4FA');
        gradient.addColorStop(1, '#4FC3F7');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 얼굴
        // 눈
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-8, -6, 6, 6);
        ctx.fillRect(2, -6, 6, 6);
        
        // 눈동자
        ctx.fillStyle = '#000000';
        ctx.fillRect(-6, -4, 2, 2);
        ctx.fillRect(4, -4, 2, 2);
        
        // 입 (작은 선)
        ctx.strokeStyle = '#0288D1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, 4);
        ctx.lineTo(5, 4);
        ctx.stroke();
        
        // 안테나
        ctx.strokeStyle = '#0288D1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, -radius - 8);
        ctx.stroke();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(0, -radius - 8, 3, 0, Math.PI * 2);
        ctx.fill();
    },
    
    // ============================================
    // 후크 라인 그리기
    // ============================================
    drawHookLine() {
        const ctx = this.ctx;
        const robot = Robot.body;
        const hook = Robot.hook;
        
        // 후크 포인트에서 몸까지 선
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(hook.x, hook.y);
        ctx.lineTo(robot.x, robot.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 후크 포인트 표시
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(hook.x, hook.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    },
    
    // ============================================
    // 디버그 정보
    // ============================================
    drawDebugInfo() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 70, 200, 100);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Pos: ${Math.floor(Robot.body.x)}, ${Math.floor(Robot.body.y)}`, 20, 90);
        ctx.fillText(`Vel: ${Robot.body.vx.toFixed(2)}, ${Robot.body.vy.toFixed(2)}`, 20, 110);
        ctx.fillText(`Hook: ${Robot.hook.active}`, 20, 130);
        ctx.fillText(`Arm: ${(Robot.arm.angle * 180 / Math.PI).toFixed(0)}°`, 20, 150);
    },
    
    // ============================================
    // 색상 유틸리티
    // ============================================
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
};

// 전역으로 내보내기
window.Renderer = Renderer;
