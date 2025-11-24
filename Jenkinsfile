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
                // package-lock 있으면 ci, 없으면 install
                sh 'npm ci || npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy to S3') {
            steps {
                // 🔹 Jenkins Credentials 의 ID: aws-credentials 사용
                withCredentials([usernamePassword(
                    credentialsId: 'aws-credentials',
                    usernameVariable: 'AWS_ACCESS_KEY_ID',
                    passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                )]) {
                    sh '''
                      export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                      export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                      export AWS_DEFAULT_REGION=$AWS_REGION

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
