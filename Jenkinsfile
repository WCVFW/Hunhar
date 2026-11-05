// =============================================================================
// Hunhar - full-stack CI/CD pipeline (backend microservices + React frontend)
//
//   Checkout -> Build (backend & frontend in parallel) -> Archive
//            -> Deploy (start services with secrets) -> Health check -> Smoke test
//
// Works on a Windows agent (PowerShell + run.ps1) or a Linux agent (bash + run.sh).
// Setup and usage: docs/JENKINS.md
// =============================================================================

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
        timeout(time: 40, unit: 'MINUTES')
    }

    parameters {
        booleanParam(name: 'RUN_TESTS', defaultValue: false, description: 'Run Maven unit tests while packaging')
        booleanParam(name: 'DEPLOY', defaultValue: true, description: 'Restart the backend services and publish the frontend on this agent')
        string(name: 'VITE_API_BASE_URL', defaultValue: 'http://localhost:8080', description: 'API gateway URL baked into the frontend build')
        string(name: 'FRONTEND_DEPLOY_DIR', defaultValue: '', description: 'Folder served by nginx/IIS (copy of dist/). Leave empty to run "vite preview" on port 5173')
    }

    environment {
        BACKEND_DIR  = 'Hunhar-backend'
        FRONTEND_DIR = 'Hunhar-frontend'
        MAVEN_OPTS   = '-Xmx1024m'
        // Keep the services alive after the build finishes (Jenkins kills child processes otherwise)
        JENKINS_NODE_COOKIE = 'dontKillMe'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Hunhar build #${env.BUILD_NUMBER} on ${isUnix() ? 'Linux' : 'Windows'} agent, commit ${env.GIT_COMMIT ?: 'local'}"
            }
        }

        stage('Build') {
            parallel {
                stage('Backend (Maven)') {
                    steps {
                        dir(env.BACKEND_DIR) {
                            script {
                                def skip = params.RUN_TESTS ? '' : '-DskipTests'
                                run("mvn -B clean package ${skip}")
                            }
                        }
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, testResults: "${env.BACKEND_DIR}/**/target/surefire-reports/*.xml"
                        }
                    }
                }
                stage('Frontend (Vite)') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            withEnv(["VITE_API_BASE_URL=${params.VITE_API_BASE_URL}"]) {
                                run('npm ci --no-audit --no-fund')
                                run('npm run build')
                            }
                        }
                    }
                }
            }
        }

        stage('Archive') {
            steps {
                archiveArtifacts artifacts: "${env.BACKEND_DIR}/*/target/*-1.0.0.jar", fingerprint: true
                zip zipFile: 'hunhar-frontend-dist.zip', dir: "${env.FRONTEND_DIR}/dist", archive: true, overwrite: true
            }
        }

        stage('Deploy') {
            when { expression { params.DEPLOY } }
            steps {
                // Secret file credential holding the full backend .env (see Hunhar-backend/.env.example)
                withCredentials([file(credentialsId: 'hunhar-backend-env', variable: 'HUNHAR_ENV_FILE')]) {
                    dir(env.BACKEND_DIR) {
                        script {
                            if (isUnix()) {
                                sh '''
                                    cp "$HUNHAR_ENV_FILE" .env && chmod 600 .env
                                    set -a; . ./.env; set +a
                                    chmod +x run.sh
                                    ./run.sh stop || true
                                    BUILD_ID=dontKillMe ./run.sh start "$DB_USER" "$DB_PASSWORD"
                                '''
                            } else {
                                powershell '''
                                    Copy-Item $env:HUNHAR_ENV_FILE .env -Force
                                    Get-Content .env | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object {
                                        $k, $v = $_ -split '=', 2
                                        [Environment]::SetEnvironmentVariable($k, $v, 'Process')
                                    }
                                    $env:BUILD_ID = 'dontKillMe'
                                    .\\run.ps1 -Action stop
                                    .\\run.ps1 -Action start -DbUser $env:DB_USER -DbPassword $env:DB_PASSWORD
                                '''
                            }
                        }
                    }
                }
                dir(env.FRONTEND_DIR) {
                    script {
                        if (params.FRONTEND_DEPLOY_DIR?.trim()) {
                            if (isUnix()) {
                                sh "mkdir -p '${params.FRONTEND_DEPLOY_DIR}' && rm -rf '${params.FRONTEND_DEPLOY_DIR}'/* && cp -r dist/* '${params.FRONTEND_DEPLOY_DIR}'/"
                            } else {
                                powershell "New-Item -ItemType Directory -Force '${params.FRONTEND_DEPLOY_DIR}' | Out-Null; Remove-Item '${params.FRONTEND_DEPLOY_DIR}\\*' -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item dist\\* '${params.FRONTEND_DEPLOY_DIR}' -Recurse -Force"
                            }
                        } else if (isUnix()) {
                            sh '''
                                pkill -f "vite preview" || true
                                BUILD_ID=dontKillMe nohup npx vite preview --host 0.0.0.0 --port 5173 --strictPort > ../frontend-preview.log 2>&1 &
                            '''
                        } else {
                            powershell '''
                                Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
                                $env:BUILD_ID = 'dontKillMe'
                                Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npx vite preview --host 0.0.0.0 --port 5173 --strictPort > ..\\frontend-preview.log 2>&1" -WindowStyle Hidden
                            '''
                        }
                    }
                }
            }
        }

        stage('Health check') {
            when { expression { params.DEPLOY } }
            steps {
                script {
                    def services = [identity: 8081, project: 8082, billing: 8083, engagement: 8084, gateway: 8080]
                    services.each { name, port ->
                        waitForHttp("http://localhost:${port}/actuator/health", '"UP"', "${name}-service")
                    }
                    if (!params.FRONTEND_DEPLOY_DIR?.trim()) {
                        waitForHttp('http://localhost:5173/', '<div id="root">', 'frontend')
                    }
                }
            }
        }

        stage('Smoke test') {
            when { expression { params.DEPLOY } }
            steps {
                script {
                    // Login with wrong credentials: proves gateway -> identity-service -> MySQL round trip
                    def login = isUnix()
                        ? sh(returnStdout: true, script: '''curl -s -m 10 -X POST -H "Content-Type: application/json" -d '{"email":"smoke@hunhar.test","password":"wrong-password"}' http://localhost:8080/api/v1/auth/login''')
                        : powershell(returnStdout: true, script: '''try { Invoke-WebRequest http://localhost:8080/api/v1/auth/login -Method POST -ContentType 'application/json' -Body '{"email":"smoke@hunhar.test","password":"wrong-password"}' -UseBasicParsing } catch { $r = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream()); $r.ReadToEnd() }''')
                    if (!login.contains('Invalid email or password')) error("Login smoke test failed: ${login}")
                    echo 'Gateway -> identity-service -> MySQL OK.'
                    // Protected endpoint without a token: must be rejected (401)
                    def code = isUnix()
                        ? sh(returnStdout: true, script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/wallets/my-wallet').trim()
                        : powershell(returnStdout: true, script: 'try { (Invoke-WebRequest http://localhost:8080/api/v1/wallets/my-wallet -UseBasicParsing).StatusCode } catch { [int]$_.Exception.Response.StatusCode }').trim()
                    if (code != '401') error("Expected 401 for an unauthenticated wallet call, got ${code}")
                    echo 'Auth guard OK (401 without token).'
                }
            }
        }
    }

    post {
        success {
            echo '''
==========================================================
 Hunhar is built and running
   Frontend : http://<agent-host>:5173
   Gateway  : http://<agent-host>:8080
   Artifacts: service JARs + hunhar-frontend-dist.zip
=========================================================='''
        }
        failure {
            script {
                // Show the tail of each service log to speed up debugging
                if (isUnix()) {
                    sh 'for f in Hunhar-backend/logs/*.log; do echo "== $f"; tail -n 40 "$f"; done || true'
                } else {
                    powershell 'Get-ChildItem Hunhar-backend\\logs\\*.log -ErrorAction SilentlyContinue | ForEach-Object { "== $($_.Name)"; Get-Content $_.FullName -Tail 40 }'
                }
            }
        }
    }
}

/** Runs a shell command on either agent type. */
def run(String cmd) {
    if (isUnix()) {
        sh cmd
    } else {
        bat cmd
    }
}

/** Polls a URL for up to 3 minutes until the body contains `expect`. */
def waitForHttp(String url, String expect, String label) {
    timeout(time: 3, unit: 'MINUTES') {
        waitUntil(initialRecurrencePeriod: 5000) {
            def body = isUnix()
                ? sh(returnStdout: true, script: "curl -s -m 5 '${url}' || true")
                : powershell(returnStdout: true, script: "try { (Invoke-WebRequest '${url}' -UseBasicParsing -TimeoutSec 5).Content } catch { '' }")
            return body?.contains(expect)
        }
    }
    echo "${label} is up (${url})"
}
