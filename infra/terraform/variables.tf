variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name used for AWS resource tags."
  type        = string
  default     = "buoy-coordinator"
}

variable "instance_type" {
  description = "EC2 instance size."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Existing EC2 SSH key pair name."
  type        = string
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to SSH to the instance."
  type        = string
}

variable "root_volume_size_gb" {
  description = "Root volume size in GB."
  type        = number
  default     = 30
}

variable "data_volume_size_gb" {
  description = "EBS data volume size for Postgres data."
  type        = number
  default     = 20
}

variable "allowed_http_cidrs" {
  description = "CIDRs allowed to reach HTTP/HTTPS."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
