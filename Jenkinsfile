pipeline {
    agent any

    environment {
        // 이미지를 구분하기 위한 빌드 태그 (필요 시 활용)
        IMAGE_TAG = "v${env.BUILD_NUMBER}"
    }

    stages {
        stage('Step 1: Checkout') {
            steps {
                echo '📦 최신 소스 코드를 가져옵니다.'
                checkout scm
            }
        }

        stage('Step 2: Environment Check') {
            steps {
                echo '🔍 인프라 환경(Docker, Compose)을 확인합니다.'
                sh 'docker version'
                sh 'docker compose version'
            }
        }

        stage('Step 3: Build & Refresh Services') {
            steps {
                echo '🛠️ backend와 frontend Docker 이미지를 빌드하고 서비스를 갱신합니다.'
                //--build 옵션을 통해 변경된 소스가 반영되도록 하며, -d로 데몬 실행합니다.
                // 젠킨스 자기 자신을 건드리지 않도록 명시적으로 배포 대상을 지정합니다.
                sh 'docker compose up -d --build postgres backend frontend'
            }
        }

        stage('Step 4: Database Migration (Optional)') {
            steps {
                echo '🗄️ 데이터베이스 스키마 및 기초 데이터를 생성합니다.'
                // DB가 처음 올라갔을 때만 실행되도록 하거나, 멱등성이 보장된 스크립트여야 합니다.
                // 여기서는 스키마 적용 명령 예시를 넣어둡니다.
                // sh 'docker exec cafeboard-db psql -U cafeboard -d cafeboard -f /tmp/schema.sql'
            }
        }

        stage('Step 5: Health Check') {
            steps {
                echo '🩺 배포된 컨테이너들의 상태를 확인합니다.'
                sh 'docker ps --filter "name=cafeboard"'
            }
        }

        stage('Step 6: Cleanup') {
            steps {
                echo '🧹 사용하지 않는 오래된 이미지들을 정리합니다.'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo '🎉 [성공] 도커 컨테이너 배포가 완료되었습니다!'
            echo '🌐 접속 주소: http://localhost (Frontend)'
        }
        failure {
            echo '❌ [실패] 배포 중 문제가 발생했습니다. 로그를 확인하세요.'
        }
    }
}
