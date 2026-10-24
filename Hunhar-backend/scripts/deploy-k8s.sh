#!/usr/bin/env bash
# Build, push and deploy THEUNOiA to Kubernetes.
#   ./scripts/deploy-k8s.sh staging                                   # local cluster, local images
#   REGISTRY=registry.theunoia.com/theunoia TAG=1.0.0 ./scripts/deploy-k8s.sh production
#   SKIP_BUILD=1 ./scripts/deploy-k8s.sh staging
set -euo pipefail
cd "$(dirname "$0")/.."

OVERLAY=${1:-staging}
NAMESPACE=$([ "$OVERLAY" = production ] && echo theunoia || echo theunoia-staging)
REGISTRY=${REGISTRY:-}
TAG=${TAG:-$(date +%Y%m%d%H%M)}
SECRETS_FILE=${SECRETS_FILE:-k8s/secrets.$OVERLAY.env}
SERVICES="api-gateway auth-service user-service project-service credit-service payment-service messaging-service \
notification-service community-service content-service analytics-service file-service"

image() { if [ -n "$REGISTRY" ]; then echo "$REGISTRY/$1:$TAG"; else echo "theunoia/$1:$TAG"; fi; }
step()  { printf '\n\033[36m==> %s\033[0m\n' "$1"; }

step "Cluster: $(kubectl config current-context)  namespace: $NAMESPACE  tag: $TAG"

if [ -z "${SKIP_BUILD:-}" ]; then
  for s in $SERVICES; do
    step "building $s"
    docker build --build-arg SERVICE="$s" -t "$(image "$s")" .
    [ -n "$REGISTRY" ] && docker push "$(image "$s")"
  done
fi

if [ ! -f "$SECRETS_FILE" ]; then
  step "Generating $SECRETS_FILE (fill in third-party keys afterwards)"
  {
    echo "jwt-secret=$(openssl rand -base64 48 | tr -d '\n')"
    echo "internal-service-token=$(openssl rand -hex 32)"
    echo "payment-encryption-key=$(openssl rand -base64 32)"
    echo "notification-encryption-key=$(openssl rand -base64 32)"
    echo "admin-email=admin@theunoia.com"
    echo "admin-password=Adm1n-$(openssl rand -hex 6)"
    echo "postgres-password=$(openssl rand -hex 16)"
    echo "rabbitmq-password=$(openssl rand -hex 16)"
    echo "redis-password=$(openssl rand -hex 16)"
    echo "s3-access-key=theunoia$(openssl rand -hex 4)"
    echo "s3-secret-key=$(openssl rand -hex 20)"
    for db in auth user project credit payment messaging notification community content analytics file; do
      echo "$db-db-password=$(openssl rand -hex 16)"
    done
    for k in razorpay-key-id razorpay-key-secret razorpay-webhook-secret razorpayx-account-number cashfree-client-id \
             cashfree-client-secret whatsapp-phone-number-id whatsapp-access-token google-client-id google-client-secret \
             smtp-username smtp-password; do echo "$k="; done
  } > "$SECRETS_FILE"
  grep admin-password "$SECRETS_FILE"
fi

step "Namespace + secret"
kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"
kubectl -n "$NAMESPACE" create secret generic theunoia-secrets --from-env-file="$SECRETS_FILE" \
  --dry-run=client -o yaml | kubectl apply -f -

step "Applying k8s/overlays/$OVERLAY"
kubectl -n "$NAMESPACE" delete job db-provisioner --ignore-not-found
kubectl apply -k "k8s/overlays/$OVERLAY"
for s in $SERVICES; do kubectl -n "$NAMESPACE" set image "deployment/$s" "$s=$(image "$s")" >/dev/null; done

step "Provisioning databases"
kubectl -n "$NAMESPACE" wait --for=condition=complete job/db-provisioner --timeout=600s

step "Waiting for rollouts"
for s in $SERVICES; do
  if ! kubectl -n "$NAMESPACE" rollout status "deployment/$s" --timeout=600s; then
    kubectl -n "$NAMESPACE" rollout undo "deployment/$s"; echo "deployment of $s failed - rolled back"; exit 1
  fi
done

kubectl -n "$NAMESPACE" get pods
echo
echo "Deployed THEUNOiA ($TAG) to $NAMESPACE."
echo "No ingress controller? kubectl -n $NAMESPACE port-forward svc/api-gateway 8080:8080"
