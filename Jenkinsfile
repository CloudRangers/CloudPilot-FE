pipeline {
    agent any

    environment {
        // 🔁 EC2에서 사용할 Git 브랜치 (필요하면 develop 등으로 변경)
        GIT_BRANCH = 'feat/#28'
        EC2_HOST   = 'ubuntu@10.0.0.244'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Node version check (Jenkins)') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install & Build (Jenkins)') {
            steps {
                sh '''
                  rm -f package-lock.json
                  npm install --force
                  npm run build
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(['ubuntu']) {
                    sh '''
ssh -o StrictHostKeyChecking=no ${EC2_HOST} << 'EOF'
set -e

APP_DIR=/home/ubuntu/cloudpilot-fe

# 📌 배포 디렉토리 없으면 생성
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "📌 Git Pull / Clone 시작"

# 처음엔 git clone, 이후 git pull
if [ ! -d .git ]; then
  git clone -b ${GIT_BRANCH} https://github.com/CloudRangers/CloudPilot-FE.git .
else
  git fetch origin ${GIT_BRANCH}
  git checkout ${GIT_BRANCH}
  git pull origin ${GIT_BRANCH}
fi

echo "📌 npm install & build 시작"

# EC2에서 의존성 설치 + 빌드
rm -f package-lock.json
npm install --force
npm run build

echo "📌 PM2 재시작 or 실행"

# PM2로 Next 서버 재시작 (포트 3000)
pm2 describe cloudpilot-fe >/dev/null 2>&1 && \
  pm2 restart cloudpilot-fe || \
  pm2 start npm --name cloudpilot-fe -- start

EOF
                    '''
                }
            }
        }

    }

    post {
        success {
            echo '✅ FE build + EC2 배포 성공 (Next.js 서버모드 PM2)'
        }
        failure {
            echo '🚨 빌드 또는 배포 실패 — Jenkins 콘솔 로그 확인'
        }
    }
}
