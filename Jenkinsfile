pipeline {
    agent any

    tools {
        nodejs 'NodeJS'   // Make sure NodeJS is configured in Jenkins
    }

    stages {

        stage('Checkout') {
            steps {
                // Jenkins already does checkout, but this ensures consistency
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo 'Building project...'
                bat 'npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                bat 'npm test'
            }
        }

        stage('Run') {
            steps {
                echo 'Starting application...'
                bat 'npm start'
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully 🎉'
        }
        failure {
            echo 'Build failed ❌'
        }
    }
}