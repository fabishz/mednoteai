locals {
  cluster_name = "${var.environment}-backend-cluster"
  service_name = "${var.environment}-backend-service"
  task_family  = "${var.environment}-backend-task"
}

resource "aws_ecs_cluster" "this" {
  name = local.cluster_name
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.service_name}"
  retention_in_days = 30
}

resource "aws_lb" "application" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.alb_subnet_ids
  security_groups    = [var.alb_security_group_id]
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.environment}-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_lb.application.vpc_id

  health_check {
    path                = "/health"
    matcher             = "200-299"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.application.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.application.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = local.task_family
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.task_cpu)
  memory                   = tostring(var.task_memory)

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.backend_image
      essential = true
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = local.service_name
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"
  platform_version= "1.6.0"
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets         = var.subnet_ids
    security_groups = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.https]
}

output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "service_name" {
  value = aws_ecs_service.backend.name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.backend.arn
}

output "alb_dns_name" {
  value = aws_lb.application.dns_name
}

output "target_group_arn" {
  value = aws_lb_target_group.backend.arn
}
