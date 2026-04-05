#!/bin/bash

# OpenClaw Configuration Backup Script
# Backs up user customizations and data

set -e

BACKUP_DIR="./backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="openclaw_backup_${TIMESTAMP}"

echo "=========================================="
echo "OpenClaw Configuration Backup"
echo "=========================================="
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Backup user customizations
echo "📦 Backing up customizations..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
  custom/ \
  config/ \
  data/ \
  --exclude='*.log' \
  --exclude='node_modules' \
  2>/dev/null || true

# Backup important files
cp .gitignore "${BACKUP_DIR}/${BACKUP_NAME}.gitignore" 2>/dev/null || true
cp package.json "${BACKUP_DIR}/${BACKUP_NAME}.package.json" 2>/dev/null || true

echo "✅ Backup completed: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""
echo "Backup includes:"
echo "  - custom/ (user customizations)"
echo "  - config/ (configuration files)"
echo "  - data/ (user data)"
echo ""
echo "To restore, run: ./scripts/restore.sh ${BACKUP_NAME}.tar.gz"
