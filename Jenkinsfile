pipeline {
    agent any

    environment {
        // 🔁 FE 브랜치 (필요하면 develop 등으로 변경)
        GIT_BRANCH = 'feat/#28'

        // 🔁 FE 배포 대상 서버
        DEPLOY_USER    = 'ubuntu'
        DEPLOY_SERVERS  = '10.0.0.244, 10.0.0.210'
        AWS_DEFAULT_REGION = "ap-northeast-2"
        ECR_ID = "291418340911"               // AWS 계정 ID
        ECR_REPO = "cloudpilot/frontend"      // FE용 ECR repo 
        IMAGE_TAG = "latest"
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

        stage('Push to ECR') {
            steps {
                script {
                    sh """
                        echo "🔐 Logging in to ECR..."
                        aws ecr get-login-password --region ${AWS_DEFAULT_REGION} \
                            | docker login --username AWS --password-stdin ${ECR_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com

                        echo "🐳 Building FE Docker Image..."
                        docker build -t cloudpilot/frontend:latest .

                        echo "🏷 Tagging Image..."
                        docker tag cloudpilot/frontend:latest ${ECR_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}

                        echo "🚀 Pushing to ECR..."
                        docker push ${ECR_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}
                    """
                }
            }
        }
        stage('Deploy to EC2 (Multi-Server)') {
            steps {
                sshagent(['was-deploy-key']) {
                    script {
                        def servers = DEPLOY_SERVERS.split(" ")

                        servers.each { server ->
                            sh """
                                echo "🚀 Deploying FE to ${server} ..."

                                ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${server} '
                                    cd /home/ubuntu/app
                                    chmod +x start.sh
                                    ./start.sh
                                '
                            """
                        }
                    }
                }
            }
        }
        
    }
}
