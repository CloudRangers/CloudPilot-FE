pipeline {
    agent any

    environment {
        // 🔹 여기 버킷 이름만 네 S3 버킷으로 변경
        S3_BUCKET = 'cloudpilot-fe'
        AWS_REGION = 'ap-northeast-2'
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins job에서 설정한 SCM 정보를 그대로 사용
                checkout scm
            }
        }

        stage('Node version check') {
            steps {
                sh 'node -v || echo "node not found"'
                sh 'npm -v || echo "npm not found"'
            }
        }

        stage('Install dependencies') {
            steps {
                sh '''
                # package-lock 삭제
                rm -f package-lock.json
                # optional dependency (플랫폼 전용 패키지)들은 설치 안 함
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
                // 🔹 AWS Credentials 타입용 바인딩
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh '''
                    # AWS Credentials 플러그인이 AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN 을 알아서 넣어줌
                    aws s3 sync out/ s3://$S3_BUCKET/ --delete
                    '''
                }
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
