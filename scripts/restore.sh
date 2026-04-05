#!/bin/bash

# OpenClaw Configuration Restore Script
# Restores user customizations and data from backup

set -e

BACKUP_FILE="$1"
BACKUP_DIR="./backup"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Please specify backup file"
  echo "Usage: ./scripts/restore.sh <backup-file.tar.gz>"
  echo ""
  echo "Available backups:"
  ls -1 "${BACKUP_DIR}"/openclaw_backup_*.tar.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file not found: ${BACKUP_DIR}/${BACKUP_FILE}"
  exit 1
fi

echo "=========================================="
echo "OpenClaw Configuration Restore"
echo "=========================================="
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

# Extract backup
echo "📦 Extracting backup..."
tar -xzf "${BACKUP_DIR}/${BACKUP_FILE}" -C "${TEMP_DIR}"

# Show what will be restored
echo ""
echo "📋 Contents to restore:"
ls -la "${TEMP_DIR}"

# Confirm restore
read -p "⚠️  This will overwrite current customizations. Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Restore cancelled"
  exit 0
fi

# Restore files
echo ""
echo "🔄 Restoring files..."

# Backup current state first
echo "  - Creating safety backup of current state..."
./scripts/backup.sh >/dev/null 2>&1 || true

# Restore customizations
if [ -d "${TEMP_DIR}/custom" ]; then
  echo "  - Restoring custom/..."
  rm -rf custom/
  cp -r "${TEMP_DIR}/custom" .
fi

if [ -d "${TEMP_DIR}/config" ]; then
  echo "  - Restoring config/..."
  rm -rf config/
  cp -r "${TEMP_DIR}/config" .
fi

if [ -d "${TEMP_DIR}/data" ]; then
  echo "  - Restoring data/..."
  rm -rf data/
  cp -r "${TEMP_DIR}/data" .
fi

echo ""
echo "✅ Restore completed!"
echo ""
echo "Please restart OpenClaw Agent to apply changes:"
echo "  npm run start"
