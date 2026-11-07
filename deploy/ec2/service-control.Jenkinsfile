// =============================================================================
// Hunhar service control: status / restart / stop / start one part of the live site from Jenkins.
// Job: hunhar-service-control (Build with Parameters). Runs `sudo hunhar-service <SERVICE> <ACTION>` on the server.
// Uses the same credentials as hunhar-live: hunhar-ec2-ssh, hunhar-ec2-host.
// =============================================================================
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '100'))
        timeout(time: 20, unit: 'MINUTES')
    }

    parameters {
        choice(name: 'SERVICE', choices: ['identity-service', 'project-service', 'billing-service', 'engagement-service', 'api-gateway', 'all-backend', 'nginx', 'mysql'],
               description: 'identity = login/sign-up/KYC · project = projects, bids, files · billing = wallet, payments · engagement = chat, notifications · api-gateway = every API call · all-backend = the 5 services one at a time · nginx = website/HTTPS (restart only) · mysql = database')
        choice(name: 'ACTION', choices: ['status', 'restart', 'stop', 'start'],
               description: 'status = just look · restart = stop + start and wait until healthy · stop = that part is DOWN until start')
        booleanParam(name: 'CONFIRM_STOP', defaultValue: false, description: 'Tick to allow STOP (that part of the live site goes down until you run START)')
    }

    stages {
        stage('Run') {
            steps {
                script {
                    if (params.ACTION == 'stop' && !params.CONFIRM_STOP) {
                        error('STOP needs CONFIRM_STOP ticked: it takes that part of the live site down.')
                    }
                    currentBuild.description = "${params.ACTION} ${params.SERVICE}"
                }
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'hunhar-ec2-ssh', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'hunhar-ec2-host', variable: 'EC2_HOST')
                ]) {
                    sh '''
                        ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
                            "$SSH_USER@$EC2_HOST" "sudo hunhar-service '$SERVICE' '$ACTION'; echo; echo 'All parts now:'; sudo hunhar-service all-backend status; sudo hunhar-service nginx status; sudo hunhar-service mysql status"
                    '''
                }
            }
        }
    }
}
