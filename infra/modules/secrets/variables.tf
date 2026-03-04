variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "secret_values" {
  type        = map(string)
  description = "Key/value pairs that should be stored in Secrets Manager"
}

