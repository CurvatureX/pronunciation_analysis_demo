output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.web.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.web.public_dns
}

output "vpc_id" {
  description = "ID of the default VPC"
  value       = data.aws_vpc.default.id
}

output "subnet_id" {
  description = "ID of the default subnet"
  value       = data.aws_subnet.default.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.web.id
}

output "key_pair_name" {
  description = "Name of the key pair"
  value       = aws_key_pair.deployer.key_name
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.web.public_ip}:3000"
} 