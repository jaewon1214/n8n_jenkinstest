pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        PROJECT_DIR = '/project123'
        N8N_DIR = '/project123/n8n'
    }

    stages {
        stage('Docker 확인') {
            steps {
                sh '''
                    set -e

                    docker version
                    docker compose version
                '''
            }
        }

        stage('Compose 파일 확인') {
            steps {
                sh '''
                    set -e

                    test -f "${N8N_DIR}/docker-compose.yml"
                    test -f "${PROJECT_DIR}/docker-compose.yml"

                    docker compose \
                      --project-directory "${N8N_DIR}" \
                      -f "${N8N_DIR}/docker-compose.yml" \
                      config --quiet

                    docker compose \
                      --project-directory "${PROJECT_DIR}" \
                      -f "${PROJECT_DIR}/docker-compose.yml" \
                      config --quiet
                '''
            }
        }

        stage('n8n 서버 실행') {
            steps {
                sh '''
                    set -e

                    docker compose \
                      --project-name project123-n8n \
                      --project-directory "${N8N_DIR}" \
                      -f "${N8N_DIR}/docker-compose.yml" \
                      up -d --build --remove-orphans
                '''
            }
        }

        stage('project123 서버 실행') {
            steps {
                sh '''
                    set -e

                    docker compose \
                      --project-name project123-app \
                      --project-directory "${PROJECT_DIR}" \
                      -f "${PROJECT_DIR}/docker-compose.yml" \
                      up -d --build --remove-orphans
                '''
            }
        }

        stage('실행 상태 확인') {
            steps {
                sh '''
                    echo "===== n8n 컨테이너 ====="

                    docker compose \
                      --project-name project123-n8n \
                      --project-directory "${N8N_DIR}" \
                      -f "${N8N_DIR}/docker-compose.yml" \
                      ps

                    echo "===== project123 컨테이너 ====="

                    docker compose \
                      --project-name project123-app \
                      --project-directory "${PROJECT_DIR}" \
                      -f "${PROJECT_DIR}/docker-compose.yml" \
                      ps

                    echo "===== 전체 컨테이너 ====="
                    docker ps
                '''
            }
        }
    }

    post {
        failure {
            sh '''
                echo "===== n8n 로그 ====="

                docker compose \
                  --project-name project123-n8n \
                  --project-directory "${N8N_DIR}" \
                  -f "${N8N_DIR}/docker-compose.yml" \
                  logs --tail=100 || true

                echo "===== project123 로그 ====="

                docker compose \
                  --project-name project123-app \
                  --project-directory "${PROJECT_DIR}" \
                  -f "${PROJECT_DIR}/docker-compose.yml" \
                  logs --tail=100 || true
            '''
        }
    }
}