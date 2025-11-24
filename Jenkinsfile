pipeline {
    agent any

    environment {
        // 🔹 네 S3 버킷 이름으로 변경
        S3_BUCKET = 'cloudpilot-fe'
        AWS_REGION = 'ap-northeast-2'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Node version check') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install dependencies') {
            steps {
                sh '''
                  # 윈도우에서 만든 lock 파일은 Jenkins(Linux)에서 문제 될 수 있으니 삭제
                  rm -f package-lock.json

                  # 플랫폼 체크로 인한 에러를 피하기 위해 강제 설치
                  npm install --force
                '''
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy to S3') {
            steps {
                // 🔹 Credentials 타입: "AWS Credentials" 에 맞는 바인딩
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh '''
                      aws s3 sync out/ s3://$S3_BUCKET/ --delete
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ FE build + S3 배포 성공'
        }
        failure {
            echo '🚨 빌드 또는 배포 실패, 로그 확인 필요'
        }
    }
}
