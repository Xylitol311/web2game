// ============================================
// 물리 엔진 모듈
// Getting Over It 스타일의 물리 시뮬레이션
// ============================================

const Physics = {
    // 물리 상수
    GRAVITY: 0.5,           // 중력 가속도
    AIR_RESISTANCE: 0.99,   // 공기 저항
    FRICTION: 0.95,         // 마찰력
    BOUNCE: 0.5,            // 반발 계수 (더 크게)
    
    // ============================================
    // 벡터 유틸리티
    // ============================================
    
    // 두 점 사이의 거리
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // 벡터 정규화
    normalize(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },
    
    // 벡터 내적
    dot(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    },
    
    // 벡터 회전
    rotate(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: x * cos - y * sin,
            y: x * sin + y * cos
        };
    },
    
    // ============================================
    // 중력 및 기본 물리
    // ============================================
    
    // 중력 적용
    applyGravity(body) {
        body.vy += this.GRAVITY;
    },
    
    // 공기 저항 적용
    applyAirResistance(body) {
        body.vx *= this.AIR_RESISTANCE;
        body.vy *= this.AIR_RESISTANCE;
    },
    
    // 마찰력 적용
    applyFriction(body, friction) {
        body.vx *= friction;
        body.vy *= friction;
    },
    
    // 위치 업데이트
    updatePosition(body) {
        body.x += body.vx;
        body.y += body.vy;
    },
    
    // ============================================
    // 후크 물리 (Getting Over It 핵심 메커니즘)
    // ============================================
    
    // 후크 포인트를 중심으로 한 제약 조건
    applyHookConstraint(body, hookPoint, armLength) {
        // 현재 거리 계산
        const dx = body.x - hookPoint.x;
        const dy = body.y - hookPoint.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        
        // 거리가 팔 길이를 초과하면 제약 적용
        if (currentDist > armLength) {
            // 정규화된 방향 벡터
            const nx = dx / currentDist;
            const ny = dy / currentDist;
            
            // 위치 보정 (팔 길이로 제한)
            body.x = hookPoint.x + nx * armLength;
            body.y = hookPoint.y + ny * armLength;
            
            // 속도 보정 (접선 방향만 유지)
            const radialVelocity = this.dot(body.vx, body.vy, nx, ny);
            body.vx -= nx * radialVelocity;
            body.vy -= ny * radialVelocity;
        }
    },
    
    // 마우스 드래그로 힘 적용 (당기기/밀기)
    applyDragForce(body, hookPoint, mouseX, mouseY, power = 0.3) {
        // 후크 포인트에서 마우스로의 방향
        const toMouseX = mouseX - hookPoint.x;
        const toMouseY = mouseY - hookPoint.y;
        const toMouseDist = Math.sqrt(toMouseX * toMouseX + toMouseY * toMouseY);
        
        if (toMouseDist === 0) return;
        
        // 정규화
        const dirX = toMouseX / toMouseDist;
        const dirY = toMouseY / toMouseDist;
        
        // 후크 포인트에서 몸으로의 방향
        const toBodyX = body.x - hookPoint.x;
        const toBodyY = body.y - hookPoint.y;
        
        // 내적으로 당기기/밀기 판단
        const dotProduct = this.dot(dirX, dirY, toBodyX, toBodyY);
        
        // 힘 적용 (마우스 방향으로)
        body.vx += dirX * power;
        body.vy += dirY * power;
    },
    
    // 진자 운동 (후크 상태에서 중력에 의한 스윙)
    applyPendulumMotion(body, hookPoint) {
        // 후크 포인트에서 몸으로의 벡터
        const dx = body.x - hookPoint.x;
        const dy = body.y - hookPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return;
        
        // 접선 방향 계산 (중력의 접선 성분)
        const tangentX = -dy / dist;
        const tangentY = dx / dist;
        
        // 중력의 접선 성분만 적용
        const gravityTangent = this.dot(0, this.GRAVITY, tangentX, tangentY);
        body.vx += tangentX * gravityTangent;
        body.vy += tangentY * gravityTangent;
    },
    
    // ============================================
    // 충돌 감지
    // ============================================
    
    // 점과 선분의 최단 거리 및 충돌점
    pointToLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            // 선분이 점인 경우
            return {
                distance: this.distance(px, py, x1, y1),
                closestX: x1,
                closestY: y1,
                t: 0
            };
        }
        
        // 투영 계산
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        
        return {
            distance: this.distance(px, py, closestX, closestY),
            closestX,
            closestY,
            t
        };
    },
    
    // 원과 선분 충돌
    circleLineCollision(cx, cy, radius, x1, y1, x2, y2) {
        const result = this.pointToLineSegment(cx, cy, x1, y1, x2, y2);
        
        if (result.distance < radius) {
            // 충돌 법선 벡터
            const nx = (cx - result.closestX) / result.distance;
            const ny = (cy - result.closestY) / result.distance;
            
            return {
                collided: true,
                penetration: radius - result.distance,
                normalX: nx,
                normalY: ny,
                contactX: result.closestX,
                contactY: result.closestY
            };
        }
        
        return { collided: false };
    },
    
    // 원과 원 충돌
    circleCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = r1 + r2;
        
        if (dist < minDist && dist > 0) {
            return {
                collided: true,
                penetration: minDist - dist,
                normalX: dx / dist,
                normalY: dy / dist,
                contactX: x1 + (dx / dist) * r1,
                contactY: y1 + (dy / dist) * r1
            };
        }
        
        return { collided: false };
    },
    
    // ============================================
    // 충돌 응답
    // ============================================
    
    // 충돌 해결 (위치 보정 + 속도 반사)
    resolveCollision(body, collision, friction = 0.8) {
        if (!collision.collided) return;
        
        // 위치 보정 (침투 깊이만큼 밀어냄) - 약간 더 밀어내서 안정성 확보
        const separationFactor = 1.01;
        body.x -= collision.normalX * collision.penetration * separationFactor;
        body.y -= collision.normalY * collision.penetration * separationFactor;
        
        // 속도의 법선 성분
        const normalVelocity = this.dot(body.vx, body.vy, collision.normalX, collision.normalY);
        
        // 충돌 중이면 (법선 방향으로 들어가고 있으면)
        if (normalVelocity < 0) {
            // 법선 방향 속도 완전히 제거 후 반사
            body.vx -= collision.normalX * normalVelocity * (1 + this.BOUNCE);
            body.vy -= collision.normalY * normalVelocity * (1 + this.BOUNCE);
            
            // 접선 방향 마찰 적용
            const tangentX = -collision.normalY;
            const tangentY = collision.normalX;
            const tangentVelocity = this.dot(body.vx, body.vy, tangentX, tangentY);
            
            body.vx -= tangentX * tangentVelocity * (1 - friction);
            body.vy -= tangentY * tangentVelocity * (1 - friction);
            
            // 매우 작은 속도는 0으로 (떨림 방지)
            if (Math.abs(body.vx) < 0.1) body.vx = 0;
            if (Math.abs(body.vy) < 0.1) body.vy = 0;
        }
    },
    
    // 미끄러짐 체크 (경사면에서 미끄러지는지)
    isSliding(collision, friction) {
        // 법선 벡터의 각도 계산
        const angle = Math.atan2(collision.normalY, collision.normalX);
        const slopeAngle = Math.abs(angle - Math.PI / 2);
        
        // 경사가 일정 각도 이상이면 미끄러짐
        const criticalAngle = Math.atan(friction);
        return slopeAngle > criticalAngle;
    }
};

// 전역으로 내보내기
window.Physics = Physics;
