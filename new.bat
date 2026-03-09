@echo off
chcp 65001 >nul 2>&1
title 创建新项目
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
echo 根据项目模板创建新项目
echo ============================================
echo 请依次输入以下参数：
echo ============================================

:: 输入旧的项目主键
set "oldsuffix="
set /p oldsuffix=请输入旧的项目主键: 

:: 输入旧的项目id
set "oldgameid="
set /p oldgameid=请输入旧的项目id: 

:: 输入新的项目主键
set "newsuffix="
set /p newsuffix=请输入新的项目主键: 

:: 输入新的项目id
set "newgameid="
set /p newgameid=请输入新的项目id: 

:: 输入是否初始化git子仓库
set "initgit="
set /p initgit=是否初始化git子仓库？(y或直接回车): 

:: 验证必要参数
if "%oldsuffix%"=="" (
    echo.
    echo [错误] 旧的项目主键不能为空
    echo.
    pause
    goto start
)

if "%oldgameid%"=="" (
    echo.
    echo [错误] 旧的项目id不能为空
    echo.
    pause
    goto start
)

if "%newsuffix%"=="" (
    echo.
    echo [错误] 新的项目主键不能为空
    echo.
    pause
    goto start
)

if "%newgameid%"=="" (
    echo.
    echo [错误] 新的项目id不能为空
    echo.
    pause
    goto start
)

:: 构建命令
set "cmd=gulp new --%oldsuffix% --%oldgameid% --%newsuffix% --%newgameid%"

:: 如果输入了y，则添加--y参数
if /i "%initgit%"=="y" set "cmd=%cmd% --y"

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
    echo [错误] 项目创建失败 (错误代码: %errorlevel%)
) else (
    echo.
    echo [成功] 项目创建完成!
)

echo.
echo ============================================
echo 操作完成
echo ============================================
pause