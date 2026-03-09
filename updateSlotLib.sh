#!/bin/bash

# 检查并安装gulp（如果未安装）
echo "============================================"
echo "检查gulp环境..."
echo "============================================"

if ! command -v gulp &> /dev/null; then
    echo "[提示] 未检测到全局安装的gulp，正在安装..."
    echo "============================================"
    echo "执行命令: npm install -g gulp"
    echo "============================================"
    npm install -g gulp

    if [ $? -ne 0 ]; then
        echo ""
        echo "[错误] gulp安装失败，请检查网络连接和npm配置"
        echo ""
        read -p "按Enter键继续..."
        exit 1
    else
        echo ""
        echo "[成功] gulp安装完成!"
        echo ""
    fi
else
    echo "[成功] 已检测到全局安装的gulp"
    echo ""
fi

# 主循环
while true; do
    clear
    echo "============================================"
    echo "更新slot库"
    echo "============================================"
    echo "请依次输入以下参数："
    echo "============================================"
    echo ""

    # 输入项目id
    game_id=""
    while [ -z "$game_id" ]; do
        read -p "请输入项目id: " game_id
        if [ -z "$game_id" ]; then
            echo ""
            echo "[错误] 项目id不能为空"
            echo ""
        fi
    done

    # 构建命令
    cmd="gulp updateSlotLib --$game_id"

    # 显示信息并执行命令
    echo ""
    echo "当前工作目录: $(pwd)"
    echo "============================================"
    echo "执行命令: $cmd"
    echo "============================================"
    echo ""

    # 执行gulp命令
    eval "$cmd"

    # 检查执行结果
    if [ $? -ne 0 ]; then
        echo ""
        echo "[错误] 启动项目更新失败 (错误代码: $?)"
    else
        echo ""
        echo "[成功] 启动项目更新完成!"
    fi

    echo ""
    echo "============================================"
    echo "操作完成"
    echo "============================================"
    read -p "按Enter键继续..."

    # 询问是否继续
    read -p "是否继续更新slot库？(y/n): " continue_choice
    if [ "$continue_choice" != "y" ] && [ "$continue_choice" != "Y" ]; then
        break
    fi
done
