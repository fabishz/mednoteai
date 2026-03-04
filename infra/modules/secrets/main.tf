resource "aws_secretsmanager_secret" "this" {
  name = "${var.environment}-mednoteai-secret"
  description = "Application secrets for ${var.environment}"
  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "this" {
  secret_id     = aws_secretsmanager_secret.this.id
  secret_string = jsonencode(var.secret_values)
}

output "secret_arn" {
  value = aws_secretsmanager_secret.this.arn
}

output "secret_id" {
  value = aws_secretsmanager_secret.this.id
}
