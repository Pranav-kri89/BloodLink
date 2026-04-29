pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                git 'https://github.com/Pranav-kri89/Blood-Donar.git'
            }
        }

        stage('Build') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'
            }
        }

        stage('Run') {
            steps {
                echo 'Starting app...'
                sh 'npm start'
            }
        }
    }
}