variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private subnets for ElastiCache"
}

variable "security_group_id" {
  type = string
}

variable "node_type" {
  type        = string
  description = "Node type for Redis"
}

