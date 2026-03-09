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
    echo "根据项目模板创建新项目"
    echo "============================================"
    echo "请依次输入以下参数："
    echo "============================================"
    echo ""

    # 输入旧的项目主键
    oldsuffix=""
    while [ -z "$oldsuffix" ]; do
        read -p "请输入旧的项目主键: " oldsuffix
        if [ -z "$oldsuffix" ]; then
            echo ""
            echo "[错误] 旧的项目主键不能为空"
            echo ""
        fi
    done

    # 输入旧的项目id
    oldgameid=""
    while [ -z "$oldgameid" ]; do
        read -p "请输入旧的项目id: " oldgameid
        if [ -z "$oldgameid" ]; then
            echo ""
            echo "[错误] 旧的项目id不能为空"
            echo ""
        fi
    done

    # 输入新的项目主键
    newsuffix=""
    while [ -z "$newsuffix" ]; do
        read -p "请输入新的项目主键: " newsuffix
        if [ -z "$newsuffix" ]; then
            echo ""
            echo "[错误] 新的项目主键不能为空"
            echo ""
        fi
    done

    # 输入新的项目id
    newgameid=""
    while [ -z "$newgameid" ]; do
        read -p "请输入新的项目id: " newgameid
        if [ -z "$newgameid" ]; then
            echo ""
            echo "[错误] 新的项目id不能为空"
            echo ""
        fi
    done

    # 输入是否初始化git子仓库
    read -p "是否初始化git子仓库？(y或直接回车): " initgit

    # 构建命令
    cmd="gulp new --$oldsuffix --$oldgameid --$newsuffix --$newgameid"

    # 如果输入了y，则添加--y参数
    if [ "$initgit" = "y" ] || [ "$initgit" = "Y" ]; then
        cmd="$cmd --y"
    fi

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
        echo "[错误] 项目创建失败 (错误代码: $?)"
    else
        echo ""
        echo "[成功] 项目创建完成!"
    fi

    echo ""
    echo "============================================"
    echo "操作完成"
    echo "============================================"
    read -p "按Enter键继续..."

    # 询问是否继续
    read -p "是否继续创建新项目？(y/n): " continue_choice
    if [ "$continue_choice" != "y" ] && [ "$continue_choice" != "Y" ]; then
        break
    fi
done
