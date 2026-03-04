locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

module "network" {
  source       = "./modules/network"
  environment  = var.environment
  cidr         = var.cidr_vpc
  allowed_ips  = var.allowed_ip_blocks
}

module "secrets" {
  source         = "./modules/secrets"
  environment    = var.environment
  secret_values  = merge(var.secret_values, {
    DB_USERNAME        = var.db_username
    DB_PASSWORD        = var.db_password
    JWT_SECRET         = lookup(var.secret_values, "JWT_SECRET", "GENERATE_ME")
    SENTRY_DSN         = lookup(var.secret_values, "SENTRY_DSN", "")
    STRIPE_SECRET_KEY  = lookup(var.secret_values, "STRIPE_SECRET_KEY", "")
  })
}

module "database" {
  source              = "./modules/database"
  environment         = var.environment
  db_subnet_ids       = module.network.private_subnets
  db_security_group_id = module.network.db_security_group_id
  db_username         = var.db_username
  db_password         = var.db_password
  db_instance_class   = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  multi_az            = var.db_multi_az
}

module "redis" {
  source         = "./modules/redis"
  environment    = var.environment
  subnet_ids     = module.network.private_subnets
  security_group_id = module.network.redis_security_group_id
  node_type      = var.redis_node_type
}

module "iam" {
  source              = "./modules/iam"
  environment         = var.environment
  secrets_manager_arn = module.secrets.secret_arn
  region              = var.region
}

module "ecs" {
  source                 = "./modules/ecs"
  environment            = var.environment
  backend_image          = var.backend_image
  subnet_ids             = module.network.private_subnets
  alb_subnet_ids         = module.network.public_subnets
  alb_security_group_id  = module.network.alb_security_group_id
  ecs_security_group_id  = module.network.ecs_security_group_id
  certificate_arn        = var.certificate_arn
  task_cpu               = 512
  task_memory            = 1024
  desired_count          = var.ecs_desired_count
  region                 = var.region
}

output "backend_endpoint" {
  value = module.ecs.alb_dns_name
}

output "database_endpoint" {
  value = module.database.db_endpoint
}

output "redis_endpoint" {
  value = module.redis.redis_endpoint
}

output "secrets_manager_arn" {
  value = module.secrets.secret_arn
}
