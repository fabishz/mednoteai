environment          = "staging"
backend_image        = "123456789012.dkr.ecr.us-east-1.amazonaws.com/mednoteai-backend:staging-<SHA>"
frontend_domain      = "staging.app.mednoteai.com"
cidr_vpc             = "10.130.0.0/16"
allowed_ip_blocks    = ["203.0.113.0/24"]
db_username          = "mednoteadmin"
db_password          = "STAGING_DB_PASSWORD"
certificate_arn      = "arn:aws:acm:us-east-1:123456789012:certificate/<STAGING_CERT>"
secret_values = {
  JWT_SECRET        = "STAGING_JWT_SECRET"
  SENTRY_DSN        = "https://<staging>@o0.ingest.sentry.io/0"
  STRIPE_SECRET_KEY = "sk_test_..."
  HIPAA_AUDIT_TOKEN = "STAGING_AUDIT_TOKEN"
}
ecs_desired_count    = 2
