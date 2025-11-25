pipeline {
    agent any

    environment {
        // 🔁 FE 브랜치 (필요하면 develop 등으로 변경)
        GIT_BRANCH = 'feat/#28'

        // 🔁 FE 배포 대상 서버
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
                // 🔑 Backend에서 성공적으로 동작한 Credential
                sshagent(['was-deploy-key']) {

                    sh """
ssh -o StrictHostKeyChecking=no ${EC2_HOST} << 'EOF'
set -e

APP_DIR=/home/ubuntu/cloudpilot-fe

echo "📌 EC2 Node 환경 점검 및 자동 설치"
if ! command -v node >/dev/null 2>&1; then
  echo "➡ Node.js 설치"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "➡ PM2 글로벌 설치"
  sudo npm install -g pm2
fi

echo "📌 배포 디렉토리 생성"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "📌 Git Pull / Clone 시작"

if [ ! -d .git ]; then
  git clone -b ${GIT_BRANCH} https://github.com/CloudRangers/CloudPilot-FE.git .
else
  git fetch origin ${GIT_BRANCH}
  git checkout ${GIT_BRANCH}
  git pull origin ${GIT_BRANCH}
fi

echo "📌 npm install & build 시작"
rm -f package-lock.json
npm install --force
npm run build

echo "📌 PM2 재시작 또는 신규 실행"
pm2 describe cloudpilot-fe >/dev/null 2>&1 && \
  pm2 restart cloudpilot-fe || \
  pm2 start npm --name cloudpilot-fe -- start

echo "🎉 FE 배포 완료!"
EOF
                    """
                }
            }
        }

    }

    post {
        success {
            echo '✅ FE build + EC2 배포 성공 (Next.js 서버모드 PM2)'
        }
        failure {
            echo '🚨 FE 배포 실패 — Jenkins 콘솔 로그 확인 필요'
        }
    }
}
