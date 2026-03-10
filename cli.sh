#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# 兼容 mac 常见的 Node 安装路径（Homebrew / 官方 pkg）
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

get_gulp_cmd() {
    if [ -x "$SCRIPT_DIR/node_modules/.bin/gulp" ]; then
        printf '%s' "$SCRIPT_DIR/node_modules/.bin/gulp"
        return 0
    fi

    if [ -f "$SCRIPT_DIR/node_modules/.bin/gulp" ]; then
        printf '%s' "sh \"$SCRIPT_DIR/node_modules/.bin/gulp\""
        return 0
    fi

    if command -v npx >/dev/null 2>&1; then
        printf '%s' 'npx --no-install gulp'
        return 0
    fi

    if command -v gulp >/dev/null 2>&1; then
        printf '%s' 'gulp'
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

GULP_CMD="$(get_gulp_cmd)"
if [ -z "$GULP_CMD" ]; then
    echo "[错误] 未找到可用的 gulp。"
    echo "请先在当前项目执行 npm install，或安装全局 gulp-cli。"
    exit 1
fi

run_once() {
    local raw_input="${1:-}"
    local game_arg=""

    while [ -z "$game_arg" ]; do
        if [ -z "$raw_input" ]; then
            read -r -p "请输入项目id（如 100042 或 game_100042）: " raw_input
        fi

        if game_arg="$(normalize_game_arg "$raw_input")"; then
            break
        fi

        echo "[错误] 项目id格式不正确，请输入纯数字、game_100042、--game_100042、game=100042 或 gameid=100042"
        raw_input=""
    done

    echo "============================================"
    echo "当前工作目录: $(pwd)"
    echo "执行命令: $GULP_CMD cli $game_arg"
    echo "============================================"

    eval "$GULP_CMD cli $game_arg"
}

if [ $# -gt 0 ]; then
    run_once "$1"
    exit $?
fi

while true; do
    clear
    echo "============================================"
    echo "Mac 导表工具"
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
    read -r -p "是否继续执行导表？(y/n): " continue_choice
    if [ "$continue_choice" != "y" ] && [ "$continue_choice" != "Y" ]; then
        break
    fi
done
