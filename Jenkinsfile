pipeline {
    agent any

    environment {
        // ── 기본 환경 설정 ──
        NODE_ENV  = 'production'

        // ── EC2 접속 정보 (필수 수정) ──
        EC2_USER  = 'ubuntu'                  // EC2 리눅스 사용자
        EC2_HOST  = '10.0.0.244'         // 🔧 여기 EC2 공인 IP 또는 도메인
        APP_DIR   = '/home/ubuntu/cloudpilot-fe' // 🔧 EC2 안에서 FE가 있을 디렉터리

        // ── 배포할 브랜치 (필수 수정) ──
        GIT_BRANCH = 'feat/#28'               // 🔧 Jenkins Job이 보고 있는 브랜치
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                // 멀티브랜치면 checkout scm 써도 되고,
                // 일반 Pipeline Job이면 브랜치/URL 지정해도 됨.
                checkout scm
            }
        }

        stage('Node version check (Jenkins)') {
            steps {
                sh '''
                  echo "== Node / npm version =="
                  node -v
                  npm  -v
                '''
            }
        }

        stage('Install & Build (Jenkins)') {
            steps {
                sh '''
                  echo "== NPM install & build on Jenkins =="
                  rm -f package-lock.json
                  npm install --force
                  npm run build
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                // Jenkins에 미리 만들어 둔 SSH 크리덴셜 ID 사용 (로그에 있는 'ubuntu')
                sshagent(credentials: ['ubuntu']) {
                    // ⚠ 여기서는 Groovy 변수를 안 쓰고, 전부 쉘에서 $EC2_HOST 식으로만 씀
                    sh '''
                      echo "== Deploy to EC2 =="
                      ssh -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" '
                        set -e

                        echo "[EC2] APP_DIR: $APP_DIR"
                        echo "[EC2] GIT_BRANCH: $GIT_BRANCH"

                        # 프로젝트 디렉터리 없으면 처음 한 번만 clone
                        if [ ! -d "$APP_DIR" ]; then
                          echo "[EC2] Cloning repo..."
                          git clone https://github.com/CloudRangers/CloudPilot-FE.git "$APP_DIR"
                        fi

                        cd "$APP_DIR"

                        echo "[EC2] Fetch & checkout branch"
                        git fetch --all
                        git checkout "$GIT_BRANCH"
                        git pull origin "$GIT_BRANCH"

                        echo "[EC2] npm install & build on EC2"
                        npm install --force
                        npm run build

                        echo "[EC2] Restart app with pm2"
                        # pm2 이름은 원하면 바꿔도 됨
                        pm2 restart cloudpilot-fe || pm2 start npm --name cloudpilot-fe -- start

                        echo "[EC2] Deploy finished"
                      '
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ FE 배포 성공!'
        }
        failure {
            echo '🚨 FE 배포 실패 — Jenkins 콘솔 로그 확인 필요'
        }
    }
}
