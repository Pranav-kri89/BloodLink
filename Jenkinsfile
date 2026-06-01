pipeline {
    agent any

    tools {
        nodejs "node"
    }

    stages {

        stage('Checkout') {
            steps {
                git 'https://github.com/Pranav-kri89/Blood-Donar.git'
            }
        }

        stage('Install Server Dependencies') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Client Dependencies') {
            steps {
                dir('client') {
                    sh 'npm install'
                }
            }
        }

        stage('Run Server') {
            steps {
                dir('server') {
                    sh 'nohup npm start &'
                }
            }
        }

        stage('Run Client') {
            steps {
                dir('client') {
                    sh 'nohup npm start &'
                }
            }
        }
    }
}