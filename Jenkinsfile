pipeline {
    agent any

    environment {
        // 빌드 번호를 활용한 이미지 관리 (필요 시 활용)
        BUILD_TAG = "build-${env.BUILD_NUMBER}"
        // 호스트에서 기본적으로 사용하는 프로젝트 폴더 이름(보통 cafeboard)으로 고정합니다.
        // 현재 폴더 이름이 cafeboard라면 아래와 같이 설정하세요.
        COMPOSE_PROJECT_NAME = "cafeboard"
    }

    stages {
        stage('Step 1: Checkout') {
            steps {
                echo '📦 최신 소스 코드를 가져옵니다.'
                checkout scm
            }
        }

        stage('Step 2: Infrastructure Check') {
            steps {
                echo '🔍 빌드 환경을 확인합니다.'
                sh 'docker version'
                sh 'docker compose version'
            }
        }

        stage('Step 3: Build Application') {
            steps {
                echo '🛠️ backend와 frontend 서비스를 빌드합니다.'
                // jenkins 서비스를 제외하고 지정된 서비스만 빌드합니다.
                sh 'docker compose build backend frontend'
            }
        }

        stage('Step 4: Deploy To Local') {
            steps {
                echo '🚀 빌드된 서비스를 배포(재시작)합니다.'
                // -p 옵션을 사용하여 프로젝트 이름을 수동으로 지정합니다.
                sh 'docker compose -p cafeboard up -d backend frontend'
            }
        }

        stage('Step 5: Health Check') {
            steps {
                echo '🩺 컨테이너 상태를 확인합니다.'
                sh 'docker compose ps'
            }
        }

        stage('Step 6: Cleanup') {
            steps {
                echo '🧹 사용하지 않는 오래된 이미지를 정리합니다.'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo '✅ [성공] backend와 frontend 배포가 완료되었습니다!'
        }
        failure {
            echo '❌ [실패] 배포 중 에러가 발생했습니다. 로그를 확인하세요.'
        }
    }
}
