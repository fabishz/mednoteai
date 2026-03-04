variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "db_subnet_ids" {
  type        = list(string)
  description = "Private subnets for the RDS instance"
}

variable "db_security_group_id" {
  type = string
}

variable "db_username" {
  type        = string
  description = "Database master username"
}

variable "db_password" {
  type        = string
  description = "Database master password"
  sensitive   = true
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class (e.g., db.t4g.small)"
}

variable "allocated_storage" {
  type        = number
  description = "Storage in GB"
}

variable "multi_az" {
  type        = bool
  description = "Enable multi-AZ deployment"
}

