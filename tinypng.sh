#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# 兼容 mac 常见的 Node 安装路径（Homebrew / 官方 pkg）
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

get_gulp_cmd() {
    if [ -x "$SCRIPT_DIR/node_modules/.bin/gulp" ]; then
        GULP_CMD=("$SCRIPT_DIR/node_modules/.bin/gulp")
        return 0
    fi

    if [ -f "$SCRIPT_DIR/node_modules/.bin/gulp" ]; then
        GULP_CMD=(sh "$SCRIPT_DIR/node_modules/.bin/gulp")
        return 0
    fi

    if command -v npx >/dev/null 2>&1; then
        GULP_CMD=(npx --no-install gulp)
        return 0
    fi

    if command -v gulp >/dev/null 2>&1; then
        GULP_CMD=(gulp)
        return 0
    fi

    return 1
}

normalize_game_arg() {
    local input="$1"

    input="${input#--}"
    input="${input#game_}"
    input="${input#game=}"
    input="${input#gameid=}"

    if [[ "$input" =~ ^[0-9]+$ ]]; then
        printf '%s' "--game_${input}"
        return 0
    fi

    return 1
}

normalize_path_arg() {
    local input="$1"

    if [[ "$input" == --path=* ]]; then
        printf '%s' "$input"
        return 0
    fi

    printf '%s' "--path=$input"
}

print_help() {
    echo "用法："
    echo "  ./tinypng.sh 100042"
    echo "  ./tinypng.sh 100042 assets"
    echo "  ./tinypng.sh game_100042 build/web-mobile"
    echo "  ./tinypng.sh --path=../game_100042/assets"
    echo "  ./tinypng.sh ../game_100042/assets/bundleGame/sprites/bg/image.jpg"
}

run_gulp() {
    echo "============================================"
    echo "当前工作目录: $(pwd)"
    printf '执行命令:'
    printf ' %q' "${GULP_CMD[@]}" tinypng "$@"
    echo
    echo "============================================"

    "${GULP_CMD[@]}" tinypng "$@"
}

run_once() {
    local input1="${1:-}"
    local input2="${2:-}"
    local mode=""
    local arg1=""
    local arg2=""

    while [ -z "$input1" ]; do
        echo "请选择压缩方式："
        echo "1) 项目ID模式"
        echo "2) 自定义路径模式"
        read -r -p "请输入项目ID或文件/目录路径: " input1
    done

    if [[ "$input1" == "-h" || "$input1" == "--help" ]]; then
        print_help
        return 0
    fi

    if [[ "$input1" == --path=* ]] || [[ "$input1" == */* ]] || [[ "$input1" == ./* ]] || [[ "$input1" == ../* ]] || [[ "$input1" == ~/* ]]; then
        mode="path"
    elif arg1="$(normalize_game_arg "$input1")"; then
        mode="project"
    else
        echo "[错误] 参数格式不正确，请输入项目ID或路径。"
        return 1
    fi

    if [ "$mode" = "path" ]; then
        arg1="$(normalize_path_arg "$input1")"
        run_gulp "$arg1"
        return $?
    fi

    if [ -z "$input2" ]; then
        read -r -p "请输入资源目录（默认 build/web-mobile，直接回车使用默认）: " input2
    fi

    if [ -n "$input2" ]; then
        arg2="--dir=$input2"
        run_gulp "$arg1" "$arg2"
        return $?
    fi

    run_gulp "$arg1"
}

declare -a GULP_CMD=()
if ! get_gulp_cmd; then
    echo "[错误] 未找到可用的 gulp。"
    echo "请先在当前项目执行 npm install，或安装全局 gulp-cli。"
    exit 1
fi

if [ $# -gt 0 ]; then
    run_once "${1:-}" "${2:-}"
    exit $?
fi

while true; do
    clear
    echo "============================================"
    echo "Mac TinyPNG 压缩工具"
    echo "============================================"

    run_once
    status=$?

    echo ""
    if [ $status -ne 0 ]; then
        echo "[错误] 执行失败 (错误代码: $status)"
    else
        echo "[成功] 执行完成"
    fi

    echo ""
    read -r -p "是否继续执行压缩？(y/n): " continue_choice
    if [ "$continue_choice" != "y" ] && [ "$continue_choice" != "Y" ]; then
        break
    fi
done
