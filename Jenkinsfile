pipeline {
    agent any

    environment {
        // EC2에서 쓸 브랜치 (지금 feat/#28 테스트 중이면 나중에 develop으로 바꾸면 됨)
        GIT_BRANCH = 'feat/#28'
        EC2_HOST   = 'ubuntu@10.0.0.244'   // 🔁 여기에 실제 WAS 서버
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
                // 🔹 Jenkins 에 등록해둔 SSH key ID 사용
                sshagent(credentials: ['ec2-ssh']) {
                    sh '''
                      ssh -o StrictHostKeyChecking=no $EC2_HOST '
                        # 배포 디렉토리 없으면 만들기
                        mkdir -p /opt/cloudpilot-fe &&
                        cd /opt/cloudpilot-fe &&

                        # 처음엔 git clone, 그 다음부턴 git pull
                        if [ ! -d .git ]; then
                          git clone -b '$GIT_BRANCH' https://github.com/CloudRangers/CloudPilot-FE.git . 
                        else
                          git fetch origin '$GIT_BRANCH' &&
                          git checkout '$GIT_BRANCH' &&
                          git pull origin '$GIT_BRANCH'
                        fi &&

                        # EC2에서 의존성 설치 + 빌드
                        rm -f package-lock.json &&
                        npm install --force &&
                        npm run build &&

                        # pm2로 Next 서버 실행/재시작 (포트 3000)
                        npx pm2 describe cloudpilot-fe >/dev/null 2>&1 && \
                          npx pm2 restart cloudpilot-fe || \
                          npx pm2 start npm --name cloudpilot-fe -- start
                      '
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ FE build + EC2 배포 성공 (Next 서버 모드, /api/prometheus 포함)'
        }
        failure {
            echo '🚨 빌드 또는 배포 실패, Jenkins 로그 확인 필요'
        }
    }
}
