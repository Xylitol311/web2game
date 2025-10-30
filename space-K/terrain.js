// ============================================
// 지형 시스템 모듈
// Getting Over It 스타일의 복잡한 지형
// ============================================

const Terrain = {
    // 지형 데이터
    obstacles: [],
    
    // ============================================
    // 지형 초기화
    // ============================================
    init() {
        this.obstacles = [];
        this.createClimbingPath();
    },
    
    // ============================================
    // 등반 경로 생성
    // ============================================
    createClimbingPath() {
        // 시작 지점 - 평평한 바닥
        this.addLine(0, 580, 300, 580, 0.8, '#8B4513');
        
        // 첫 번째 구간 - 작은 바위들
        this.addCircle(350, 560, 40, 0.6, '#808080');
        this.addCircle(420, 540, 35, 0.6, '#808080');
        
        // 경사진 언덕
        this.addLine(450, 530, 550, 480, 0.5, '#8B4513');
        this.addLine(550, 480, 650, 460, 0.5, '#8B4513');
        
        // 큰 바위 (미끄러움)
        this.addCircle(700, 420, 60, 0.3, '#A9A9A9');
        
        // 좁은 틈
        this.addLine(650, 380, 680, 360, 0.7, '#654321');
        this.addLine(720, 360, 750, 380, 0.7, '#654321');
        
        // 중간 플랫폼
        this.addLine(200, 350, 400, 350, 0.8, '#8B4513');
        
        // 가파른 경사
        this.addLine(400, 350, 500, 280, 0.4, '#696969');
        
        // 큰 원형 바위 (어려운 구간)
        this.addCircle(550, 240, 70, 0.3, '#778899');
        this.addCircle(450, 200, 50, 0.4, '#778899');
        
        // 불안정한 작은 바위들
        this.addCircle(350, 180, 25, 0.5, '#808080');
        this.addCircle(300, 160, 30, 0.5, '#808080');
        
        // 가파른 벽
        this.addLine(250, 150, 280, 100, 0.6, '#654321');
        this.addLine(280, 100, 350, 80, 0.6, '#654321');
        
        // 최종 구간 - 큰 바위
        this.addCircle(450, 60, 55, 0.4, '#A9A9A9');
        this.addCircle(550, 50, 45, 0.4, '#A9A9A9');
        
        // 정상 플랫폼
        this.addLine(600, 40, 750, 40, 0.9, '#8B4513');
        
        // 추가 장애물 - 떨어질 수 있는 위험 구간
        this.addCircle(100, 450, 40, 0.5, '#808080');
        this.addCircle(150, 400, 35, 0.5, '#808080');
        
        // 왼쪽 벽 (떨어지지 않도록)
        this.addLine(0, 0, 0, 600, 0.8, '#654321');
        // 오른쪽 벽
        this.addLine(800, 0, 800, 600, 0.8, '#654321');
    },
    
    // ============================================
    // 지형 추가 함수
    // ============================================
    
    // 선분 지형 추가
    addLine(x1, y1, x2, y2, friction, color) {
        this.obstacles.push({
            type: 'line',
            x1, y1, x2, y2,
            friction,
            color
        });
    },
    
    // 원형 지형 추가
    addCircle(x, y, radius, friction, color) {
        this.obstacles.push({
            type: 'circle',
            x, y, radius,
            friction,
            color
        });
    },
    
    // ============================================
    // 충돌 체크
    // ============================================
    
    // 팔 끝과 지형 충돌 체크 (후크 가능 여부)
    checkArmCollision(armTipX, armTipY, armRadius = 5) {
        for (let obstacle of this.obstacles) {
            let collision = null;
            
            if (obstacle.type === 'line') {
                collision = Physics.circleLineCollision(
                    armTipX, armTipY, armRadius,
                    obstacle.x1, obstacle.y1, obstacle.x2, obstacle.y2
                );
            } else if (obstacle.type === 'circle') {
                collision = Physics.circleCircleCollision(
                    armTipX, armTipY, armRadius,
                    obstacle.x, obstacle.y, obstacle.radius
                );
            }
            
            if (collision && collision.collided) {
                return {
                    collided: true,
                    hookX: collision.contactX,
                    hookY: collision.contactY,
                    obstacle
                };
            }
        }
        
        return { collided: false };
    },
    
    // 로봇 몸체와 지형 충돌 체크
    checkBodyCollision(bodyX, bodyY, bodyRadius) {
        const collisions = [];
        
        for (let obstacle of this.obstacles) {
            let collision = null;
            
            if (obstacle.type === 'line') {
                collision = Physics.circleLineCollision(
                    bodyX, bodyY, bodyRadius,
                    obstacle.x1, obstacle.y1, obstacle.x2, obstacle.y2
                );
            } else if (obstacle.type === 'circle') {
                collision = Physics.circleCircleCollision(
                    bodyX, bodyY, bodyRadius,
                    obstacle.x, obstacle.y, obstacle.radius
                );
            }
            
            if (collision && collision.collided) {
                collision.friction = obstacle.friction;
                collisions.push(collision);
            }
        }
        
        return collisions;
    },
    
    // ============================================
    // 특수 지형 체크
    // ============================================
    
    // 안정적인 착지 지점인지 체크
    isStableLanding(bodyX, bodyY, bodyRadius) {
        const collisions = this.checkBodyCollision(bodyX, bodyY, bodyRadius);
        
        for (let collision of collisions) {
            // 법선 벡터가 위를 향하고 있으면 안정적
            if (collision.normalY < -0.5) {
                return true;
            }
        }
        
        return false;
    },
    
    // 목표 지점 도달 체크 (정상)
    hasReachedGoal(bodyY) {
        return bodyY < 60;  // 정상 근처
    }
};

// 전역으로 내보내기
window.Terrain = Terrain;
