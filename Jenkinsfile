pipeline {
    agent any

    environment {
        // ── EC2 접속 정보 ──
        EC2_USER  = 'ubuntu'                          // EC2 리눅스 사용자
        EC2_HOST  = '10.0.0.244'                      // EC2 IP 또는 도메인
        APP_DIR   = '/home/ubuntu/cloudpilot-fe'      // EC2 안에서 FE 디렉터리

        // ── 배포할 브랜치 ──
        GIT_BRANCH = 'feat/#28'
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                // 멀티브랜치면 checkout scm 그대로 사용
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

                  # 필요 없으면 주석 처리해도 됨
                  # rm -f package-lock.json

                  # devDependencies까지 포함해서 설치
                  npm install --force --include=dev
                  npm run build
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                // 🔐 Jenkins에 미리 등록된 SSH Credential ID (was-deploy-key 사용)
                sshagent(credentials: ['was-deploy-key']) {
                    // 여기서는 Groovy 변수를 써서 실제 값들을 원격 쉘로 주입
                    sh """
                      echo "== Deploy to EC2 =="

                      ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                        set -e

                        APP_DIR="${env.APP_DIR}"
                        GIT_BRANCH="${env.GIT_BRANCH}"

                        echo "[EC2] APP_DIR: \$APP_DIR"
                        echo "[EC2] GIT_BRANCH: \$GIT_BRANCH"

                        # 프로젝트 디렉터리 없으면 처음 한 번만 clone
                        if [ ! -d "\$APP_DIR" ]; then
                          echo "[EC2] Cloning repo..."
                          git clone https://github.com/CloudRangers/CloudPilot-FE.git "\$APP_DIR"
                        fi

                        cd "\$APP_DIR"

                        echo "[EC2] Fetch & checkout branch"
                        git fetch --all
                        git checkout "\$GIT_BRANCH"
                        git pull origin "\$GIT_BRANCH"

                        echo "[EC2] npm install & build on EC2"
                        npm install --force --include=dev
                        npm run build

                        echo "[EC2] Restart app with pm2"
                        pm2 restart cloudpilot-fe || pm2 start npm --name cloudpilot-fe -- start

                        echo "[EC2] Deploy finished"
                      '
                    """
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
