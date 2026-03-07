variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment identifier (dev, staging, prod)"
  type        = string
  default     = "staging"
}

variable "project_name" {
  description = "Logical project name used for tags"
  type        = string
  default     = "mednoteai"
}

variable "cidr_vpc" {
  description = "CIDR block for the application VPC"
  type        = string
  default     = "10.100.0.0/16"
}

variable "allowed_ip_blocks" {
  description = "CIDR blocks allowed to reach management endpoints (SSH, database admin)"
  type        = list(string)
  default     = ["203.0.113.0/24"]
}

variable "backend_image" {
  description = "Container image tag that CI/CD pushes for this environment"
  type        = string
  default     = ""
}

variable "frontend_domain" {
  description = "Frontend domain (app.mednoteai.com or staging subdomain) used for CORS and TLS"
  type        = string
  default     = "app.mednoteai.com"
}

variable "db_username" {
  description = "Database admin username"
  type        = string
  default     = "mednoteadmin"
}

variable "db_password" {
  description = "Database password stored securely in Terraform variable"
  type        = string
  sensitive   = true
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the HTTPS listener"
  type        = string
  default     = ""
}

variable "secret_values" {
  description = "Secrets that will be pushed into Secrets Manager for the backend"
  type        = map(string)
  default     = {}
}

variable "ecs_desired_count" {
  description = "Initial number of backend tasks for this environment"
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.small"
}

variable "db_allocated_storage" {
  description = "Minimum allocated storage for the database"
  type        = number
  default     = 20
}

variable "db_multi_az" {
  description = "Multi-AZ deployment to improve failover resilience"
  type        = bool
  default     = false
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "common_tags" {
  description = "Common tags to apply to every resource"
  type        = map(string)
  default     = {}
}

variable "enable_waf" {
  description = "Enable AWS WAF for the public ALB"
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "Maximum requests per 5 minutes per source IP before WAF blocks"
  type        = number
  default     = 2000
}

variable "alb_access_logs_enabled" {
  description = "Enable ALB access logs to S3"
  type        = bool
  default     = true
}

variable "alb_logs_retention_days" {
  description = "Retention period for ALB access logs"
  type        = number
  default     = 90
}
