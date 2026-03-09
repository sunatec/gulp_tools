@echo off
chcp 65001 >nul 2>&1
title 更新启动项目
color 0A

:: 检查并安装gulp（如果未安装）
echo ============================================
echo 检查gulp环境...
echo ============================================
where gulp >nul 2>nul
if %errorlevel% neq 0 (
    echo [提示] 未检测到全局安装的gulp，正在安装...
    echo ============================================
    echo 执行命令: npm install -g gulp
    echo ============================================
    npm install -g gulp
    
    if %errorlevel% neq 0 (
        echo.
        echo [错误] gulp安装失败，请检查网络连接和npm配置
        echo.
        pause
        exit /b 1
    ) else (
        echo.
        echo [成功] gulp安装完成!
        echo.
    )
) else (
    echo [成功] 已检测到全局安装的gulp
    echo.
)

:start
cls
echo ============================================
echo 更新启动项目
echo ============================================
echo 请依次输入以下参数：
echo ============================================

:: 输入项目id
set "game_id="
set /p game_id=请输入项目id: 


:: 验证必要参数
if "%game_id%"=="" (
    echo.
    echo [错误] 项目id不能为空
    echo.
    pause
    goto start
)


:: 构建命令
set "cmd=gulp updateStartLib --%game_id%"


:: 显示信息并执行命令
echo.
echo 当前工作目录: %cd%
echo ============================================
echo 执行命令: %cmd%
echo ============================================

:: 执行gulp命令
call %cmd%

:: 检查执行结果
if %errorlevel% neq 0 (
    echo.
    echo [错误] 启动项目更新失败 (错误代码: %errorlevel%)
) else (
    echo.
    echo [成功] 启动项目更新完成!
)

echo.
echo ============================================
echo 操作完成
echo ============================================
pause