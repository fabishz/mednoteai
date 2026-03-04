variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "backend_image" {
  type        = string
  description = "Container image URI for backend service"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private subnets for ECS tasks"
}

variable "alb_subnet_ids" {
  type        = list(string)
  description = "Public subnets for ALB"
}

variable "alb_security_group_id" {
  type = string
}

variable "ecs_security_group_id" {
  type = string
}

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN for HTTPS listener"
}

variable "task_cpu" {
  type        = number
  description = "Task CPU allocation"
  default     = 512
}

variable "task_memory" {
  type        = number
  description = "Task memory allocation"
  default     = 1024
}

variable "desired_count" {
  type        = number
  description = "Initial desired number of tasks"
  default     = 2
}

variable "region" {
  type        = string
  description = "AWS region where ECS resources are running"
}
