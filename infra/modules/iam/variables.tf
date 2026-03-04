variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "secrets_manager_arn" {
  type        = string
  description = "Secrets Manager secret ARN required by backend tasks"
}

variable "region" {
  type        = string
  description = "AWS region where IAM roles are created"
}
