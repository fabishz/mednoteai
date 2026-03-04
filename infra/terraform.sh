#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v terraform >/dev/null; then
  echo "terraform CLI not found; install it before running this script" >&2
  exit 1
fi

usage() {
  cat <<'EOF'
Usage: ./terraform.sh <plan|apply> <dev|staging|production> [-- <terraform args>]
Example: ./terraform.sh plan staging -- -target=module.ecs
EOF
  exit 1
}

[ "$#" -ge 2 ] || usage

command="$1"
environment="$2"
shift 2

case "$environment" in
  dev) tfvars="terraform.dev.tfvars" ;;
  staging) tfvars="terraform.staging.tfvars" ;;
  production) tfvars="terraform.prod.tfvars" ;;
  *) echo "Unknown environment: $environment" >&2; usage ;;
esac

[ -f "$tfvars" ] || { echo "Missing var file: $tfvars" >&2; exit 1; }

echo "Running terraform $command with var file: $tfvars"
terraform init >/tmp/terraform-init.log 2>&1 || true
terraform "$command" -var-file="$tfvars" "$@" | tee /tmp/terraform-"$command".log
