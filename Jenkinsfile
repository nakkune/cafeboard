pipeline {
    agent any

    environment {
        // 이미지를 구분하기 위한 빌드 태그
        IMAGE_TAG = "v${env.BUILD_NUMBER}"
        // K3s 프로젝트 이름 (충돌 방지용)
        K8S_NAMESPACE = "default"
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
                echo '🔍 인프라 환경(Docker, Compose, K8s)을 확인합니다.'
                sh 'docker version'
                sh 'docker compose version'
                sh 'kubectl cluster-info'
            }
        }

        stage('Step 3: Build Docker Images') {
            steps {
                echo '🛠️ backend와 frontend Docker 이미지를 빌드합니다.'
                // 기존 Compose 설정을 활용하여 이미지를 빌드합니다.
                sh 'docker compose build backend frontend'
            }
        }

        stage('Step 4: Import Images to K3s') {
            steps {
                echo '🚚 이미지를 K3s가 인식할 수 있도록 처리합니다.'
                // K3s는 로컬 도커와 이미지 저장소가 다를 수 있어서, 수동으로 로드해주는 과정이 필요할 수 있습니다.
                // 만약 K3s가 Docker를 직접 사용하지 않는다면 아래 과정을 거쳐야 합니다.
                //sh 'docker save cafeboard-backend:latest | k3s ctr images import -'
                //sh 'docker save cafeboard-frontend:latest | k3s ctr images import -'
                echo '이 단계는 K8s Manifest의 imagePullPolicy: IfNotPresent 설정으로 대체합니다.'
            }
        }

        stage('Step 5: Deploy To Kubernetes') {
            steps {
                echo '🚀 Kubernetes 클러스터에 배포를 시작합니다.'
                // k8s 폴더 안의 manifest 파일들을 적용합니다. (DB, Backend, Frontend 모두 포함)
                sh 'kubectl apply -f k8s/'
            }
        }

        stage('Step 6: Health Check') {
            steps {
                echo '🩺 배포된 서비스의 상태를 확인합니다.'
                sh 'kubectl get pods'
                sh 'kubectl get svc'
            }
        }
    }

    post {
        success {
            echo '🎉 [성공] 쿠버네티스 배포가 완료되었습니다!'
            echo '🌐 접속 주소: http://localhost (Frontend)'
        }
        failure {
            echo '❌ [실패] 배포 중 문제가 발생했습니다. 로그를 확인하세요.'
        }
    }
}
