resource "aws_db_subnet_group" "default" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.db_subnet_ids

  tags = {
    Name = "${var.environment}-db-subnet-group"
  }
}

resource "aws_db_parameter_group" "postgres" {
  name        = "${var.environment}-pg"
  family      = "postgres14"
  description = "Performance-tuned parameter group for MedNoteAI ${var.environment}"

  parameter {
    name  = "log_min_duration_statement"
    value = "500"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_db_instance" "postgres" {
  identifier              = "${var.environment}-postgres"
  engine                  = "postgres"
  engine_version          = "14.9"
  instance_class          = var.db_instance_class
  allocated_storage       = var.allocated_storage
  storage_type            = "gp3"
  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [var.db_security_group_id]
  username                = var.db_username
  password                = var.db_password
  multi_az                = var.multi_az
  publicly_accessible     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  deletion_protection     = true
  parameter_group_name    = aws_db_parameter_group.postgres.name
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = {
    Environment = var.environment
  }
}

output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "db_port" {
  value = aws_db_instance.postgres.port
}

output "db_identifier" {
  value = aws_db_instance.postgres.id
}

output "rds_publicly_accessible" {
  value = aws_db_instance.postgres.publicly_accessible
}
