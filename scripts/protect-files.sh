#!/bin/bash

# OpenClaw 文件保护脚本
# 防止重要文件被意外还原或覆盖

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${PROJECT_DIR}"

echo "=========================================="
echo "🔒 OpenClaw 文件保护系统"
echo "=========================================="
echo ""

# 保护函数
setup_git_protection() {
    echo "📋 设置 Git 文件保护..."
    
    # 配置 merge.ours 驱动
    git config merge.ours.driver true || true
    
    # 确保 .gitattributes 存在
    if [ -f ".gitattributes" ]; then
        echo "  ✅ .gitattributes 已配置"
    else
        echo "  ⚠️  .gitattributes 不存在"
    fi
    
    # 检查重要文件是否在 .gitignore 中
    local protected_files=(
        "config/security.json"
        "config/performance.json"
        "config/protection.json"
        ".env"
        ".env.local"
    )
    
    for file in "${protected_files[@]}"; do
        if grep -q "^${file}$" .gitignore 2>/dev/null || \
           grep -q "^${file%/*}/" .gitignore 2>/dev/null; then
            echo "  ✅ ${file} 已在 .gitignore 中"
        else
            echo "  ⚠️  ${file} 未在 .gitignore 中"
        fi
    done
}

create_protected_backup() {
    echo ""
    echo "💾 创建受保护文件的备份..."
    
    local BACKUP_DIR="${PROJECT_DIR}/backup/protected"
    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p "${BACKUP_DIR}"
    
    local files_to_backup=(
        "config/security.json"
        "config/performance.json"
        "config/protection.json"
        ".env"
        ".env.local"
    )
    
    local backup_list=""
    for file in "${files_to_backup[@]}"; do
        if [ -f "${file}" ]; then
            cp "${file}" "${BACKUP_DIR}/$(basename "${file}").${TIMESTAMP}"
            echo "  ✅ 已备份: ${file}"
            backup_list="${backup_list} ${file}"
        fi
    done
    
    if [ -n "${backup_list}" ]; then
        echo ""
        echo "📦 备份已保存到: ${BACKUP_DIR}/"
        echo ""
        echo "要恢复备份，使用:"
        echo "  cp ${BACKUP_DIR}/<filename>.<timestamp> <target-file>"
    fi
}

check_file_status() {
    echo ""
    echo "🔍 检查文件状态..."
    
    local protected_files=(
        "config/security.json"
        "config/performance.json"
        "config/protection.json"
        ".env"
        ".env.local"
    )
    
    for file in "${protected_files[@]}"; do
        if [ -f "${file}" ]; then
            local status=$(git status --porcelain "${file}" 2>/dev/null || echo "")
            if [ -n "${status}" ]; then
                echo "  ⚠️  ${file}: ${status}"
            else
                echo "  ✅ ${file}: 未变更"
            fi
        else
            echo "  ❌ ${file}: 文件不存在"
        fi
    done
}

prevent_git_restore() {
    echo ""
    echo "⚠️  防止 Git 还原操作..."
    echo ""
    echo "重要提示:"
    echo "  1. 不要使用 'git restore' 或 'git checkout' 还原配置文件"
    echo "  2. 不要使用 'git reset --hard' 重置到旧版本"
    echo "  3. 合并时，Git 会自动保留本地配置文件"
    echo ""
    echo "如果确实需要还原某个文件，请手动操作并确认。"
}

show_help() {
    echo "用法: ./scripts/protect-files.sh [命令]"
    echo ""
    echo "命令:"
    echo "  setup     - 设置 Git 文件保护"
    echo "  backup    - 备份受保护文件"
    echo "  status    - 检查文件状态"
    echo "  warn      - 显示防止还原警告"
    echo "  all       - 执行所有保护操作 (默认)"
    echo "  help      - 显示此帮助信息"
    echo ""
}

# 主程序
case "${1:-all}" in
    setup)
        setup_git_protection
        ;;
    backup)
        create_protected_backup
        ;;
    status)
        check_file_status
        ;;
    warn)
        prevent_git_restore
        ;;
    all)
        setup_git_protection
        create_protected_backup
        check_file_status
        prevent_git_restore
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ 未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
echo "✅ 文件保护检查完成！"
echo ""
echo "💡 提示: 定期运行此脚本来确保文件安全"
