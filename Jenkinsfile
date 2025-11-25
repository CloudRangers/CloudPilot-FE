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

        
    }
}
