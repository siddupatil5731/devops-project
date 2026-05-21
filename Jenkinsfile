pipeline {
    // Execute this pipeline on any available agent
    agent any

    // Define environment variables that are reused across pipeline stages
    environment {
        IMAGE_NAME = 'flask-devops-app'
        CONTAINER_NAME = 'flask-app'
        PORT = '5000'
    }

    stages {
        stage('Clone Repository') {
            steps {
                echo 'Stage 1: Cloning repository...'
                // Checkout the source code from the source control management (SCM) system
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Stage 2: Building Docker Image...'
                // Build the image using the Dockerfile in the workspace root
                // NOTE: If Jenkins runs on a Windows agent natively, change 'sh' to 'bat'
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Stop Old Container') {
            steps {
                echo 'Stage 3: Stopping old container if it exists...'
                // Stop the container. '|| true' (or '|| exit 0') prevents pipeline failure if container isn't running
                sh "docker stop ${CONTAINER_NAME} || true"
            }
        }

        stage('Remove Old Container') {
            steps {
                echo 'Stage 4: Removing old container if it exists...'
                // Remove the container so its name can be reused
                sh "docker rm ${CONTAINER_NAME} || true"
            }
        }

        stage('Run New Container') {
            steps {
                echo 'Stage 5: Running new container...'
                // Launch the container in detached mode (-d) and map ports
                sh "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:${PORT} ${IMAGE_NAME}:latest"
            }
        }
    }

    // Post-execution blocks to notify or run steps depending on build success/failure
    post {
        success {
            echo "CI/CD Pipeline executed successfully! App is running on port ${PORT}."
        }
        failure {
            echo "Pipeline failed. Review the logs above to identify and resolve the error."
        }
    }
}
