variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "cidr" {
  type        = string
  description = "CIDR block for the VPC"
}

variable "allowed_ips" {
  type        = list(string)
  description = "CIDR blocks allowed for administrative access"
}

