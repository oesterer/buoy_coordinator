#!/usr/bin/env bash
set -euxo pipefail

dnf update -y
dnf install -y docker git rsync
systemctl enable --now docker
usermod -aG docker ec2-user

mkdir -p /home/ec2-user/.docker/cli-plugins
arch="$(uname -m)"
case "$arch" in
  x86_64) compose_arch="x86_64" ;;
  aarch64|arm64) compose_arch="aarch64" ;;
  *) echo "Unsupported architecture for Docker Compose plugin: $arch" >&2; exit 1 ;;
esac
curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-${compose_arch}" -o /home/ec2-user/.docker/cli-plugins/docker-compose
chmod +x /home/ec2-user/.docker/cli-plugins/docker-compose
chown -R ec2-user:ec2-user /home/ec2-user/.docker

mkdir -p /opt/buoy_coordinator /opt/buoy-data
chown -R ec2-user:ec2-user /opt/buoy_coordinator /opt/buoy-data

DATA_DEVICE=""
for device in /dev/nvme1n1 /dev/xvdf /dev/sdf; do
  if [ -b "$device" ]; then
    DATA_DEVICE="$device"
    break
  fi
done

if [ -n "$DATA_DEVICE" ]; then
  if ! blkid "$DATA_DEVICE"; then
    mkfs.xfs "$DATA_DEVICE"
  fi

  DATA_UUID="$(blkid -s UUID -o value "$DATA_DEVICE")"
  if ! grep -q "$DATA_UUID" /etc/fstab; then
    echo "UUID=$DATA_UUID /opt/buoy-data xfs defaults,nofail 0 2" >> /etc/fstab
  fi
  mount -a
  mkdir -p /opt/buoy-data/postgres
  chown -R 70:70 /opt/buoy-data/postgres
  chmod 700 /opt/buoy-data/postgres
fi
