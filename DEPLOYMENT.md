# Deployment Guide

This guide explains how to deploy the Pronunciation Analysis Demo to AWS EC2 using GitHub Actions and Terraform.

## Prerequisites

### 1. AWS Account Setup

- An AWS account with appropriate permissions
- AWS Access Key and Secret Key configured

### 2. GitHub Repository Setup

You need to configure the following secrets in your GitHub repository settings:

#### Required Secrets:

- `AWS_ACCESS_KEY`: Your AWS access key
- `AWS_SECRET_KEY`: Your AWS secret key

**Note**: SSH keys are automatically generated during deployment, so no manual SSH key setup is required.

### 3. Terraform Configuration

No manual Terraform configuration is needed - the CI/CD pipeline handles everything automatically with sensible defaults.

## Deployment Process

### Automatic Deployment

The deployment happens automatically when:

- Code is pushed to the `main` branch
- You manually trigger the workflow from GitHub Actions

### Manual Deployment

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to EC2" workflow
4. Click "Run workflow" button

## Infrastructure Overview

The Terraform configuration creates:

- **Uses Default VPC**: Uses your existing default VPC and subnet
- **EC2 Instance**: Amazon Linux 2023 instance with Node.js 18 and PM2
- **Security Groups**: Configured for HTTP, HTTPS, SSH, and Next.js (port 3000)
- **Elastic IP**: Static IP address for the instance
- **Key Pair**: SSH key for secure access

## Application Deployment

The deployment process:

1. **Test**: Runs linting and build tests
2. **Infrastructure**: Creates/updates AWS resources using Terraform
3. **Build**: Builds the Next.js application
4. **Deploy**: Copies files to EC2 and starts the application

## Accessing Your Application

After successful deployment:

- Application URL: `http://[ELASTIC_IP]:3000`
- Alternative (via Nginx): `http://[ELASTIC_IP]` (port 80)

The Elastic IP will be displayed in the Terraform output.

## Configuration Files

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

- Triggers on push to main branch and manual dispatch
- Runs tests, terraform, and deployment steps
- Uses GitHub secrets for AWS credentials and SSH keys

### Terraform Files (`infrastructure/`)

- `main.tf`: Main infrastructure configuration
- `variables.tf`: Input variables
- `outputs.tf`: Output values (like public IP)
- `user_data.sh`: EC2 initialization script
- `terraform.tfvars.example`: Example configuration

## Security Considerations

### Production Recommendations:

1. **Restrict SSH access**: Update security group to allow SSH only from your IP
2. **Use IAM roles**: Instead of access keys, use IAM roles for EC2
3. **Enable CloudTrail**: For audit logging
4. **Use HTTPS**: Configure SSL certificates for production
5. **Environment variables**: Set up proper environment variables for production

### Environment Variables

Create a `.env.local` file on the EC2 instance with your production values:

```bash
# On EC2 instance
cd /home/ec2-user/app
nano .env.local
```

Add your production environment variables based on `env.example`.

## Troubleshooting

### Common Issues:

1. **Deployment fails at SSH step**

   - SSH keys are auto-generated during deployment
   - Check if EC2 instance is properly created and accessible

2. **Application not accessible**

   - Check security group rules
   - Verify EC2 instance is running
   - Check PM2 process status: `pm2 list`

3. **Terraform errors**
   - Ensure AWS credentials have sufficient permissions
   - Check for resource limits in your AWS account

### SSH into EC2 Instance:

```bash
ssh -i ~/.ssh/pronunciation-analysis-key ec2-user@[ELASTIC_IP]
```

### Check Application Status:

```bash
# On EC2 instance
pm2 list
pm2 logs pronunciation-analysis-demo
```

### Restart Application:

```bash
# On EC2 instance
cd /home/ec2-user/app
pm2 restart pronunciation-analysis-demo
```

## Cleanup

To destroy the infrastructure:

```bash
cd infrastructure
terraform destroy -auto-approve
```

Or run the destroy workflow if you create one.

## Cost Estimation

Estimated monthly costs (us-west-1):

- EC2 t2.nano instance: ~$4.20/month
- Root storage (12GB gp3): ~$1.20/month
- Elastic IP (when associated): Free
- Data transfer: Variable based on usage

**Total estimated cost**: ~$5.40/month

## Support

For issues with this deployment setup:

1. Check GitHub Actions logs for deployment errors
2. Check AWS CloudWatch logs for application issues
3. SSH into the EC2 instance for direct troubleshooting
