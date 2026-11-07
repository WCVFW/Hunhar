// =============================================================================
// One Jenkins job per Hunhar part ("Microservices" tab): status / restart / stop / start that part only.
// Template: deploy/jenkins/create-service-jobs.sh replaces @@SERVICE@@ and creates jobs svc-<name>.
// Runs `sudo hunhar-service <SERVICE> <ACTION>` on the server (credentials hunhar-ec2-ssh, hunhar-ec2-host).
// =============================================================================
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '50'))
        timeout(time: 20, unit: 'MINUTES')
    }

    environment {
        SERVICE = '@@SERVICE@@'
    }

    parameters {
        choice(name: 'ACTION', choices: ['status', 'restart', 'stop', 'start'],
               description: 'status = just look · restart = stop + start, waits until healthy · stop = DOWN until start · start = bring it back up')
        booleanParam(name: 'CONFIRM_STOP', defaultValue: false, description: 'Tick to allow STOP: this part of the live site goes down until you run START')
    }

    stages {
        stage('Run') {
            steps {
                script {
                    if (params.ACTION == 'stop' && !params.CONFIRM_STOP) {
                        error("STOP needs CONFIRM_STOP ticked: ${env.SERVICE} goes down until you run START.")
                    }
                    currentBuild.description = "${params.ACTION} ${env.SERVICE}"
                }
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'hunhar-ec2-ssh', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'hunhar-ec2-host', variable: 'EC2_HOST')
                ]) {
                    sh '''
                        ssh -i "$SSH_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
                            "$SSH_USER@$EC2_HOST" "sudo hunhar-service '$SERVICE' '$ACTION'"
                    '''
                }
            }
        }
    }
}
