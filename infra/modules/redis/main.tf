resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.environment}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.environment}-redis-subnet-group"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.environment}-redis"
  replication_group_description = "Redis cache for ${var.environment}"
  engine_symbol                 = "redis"
  engine_version                = "7.0"
  node_type                     = var.node_type
  number_cache_clusters         = 1
  automatic_failover_enabled    = true
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [var.security_group_id]
  transit_encryption_enabled    = true
  at_rest_encryption_enabled    = true

  tags = {
    Environment = var.environment
  }
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  value = aws_elasticache_replication_group.redis.port
}
