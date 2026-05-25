output "instance_id" {
  value = aws_instance.app.id
}

output "public_ip" {
  value = aws_eip.app.public_ip
}

output "ssh_command" {
  value = "ssh ec2-user@${aws_eip.app.public_ip}"
}
