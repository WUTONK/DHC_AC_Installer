; NSIS 安装向导自定义脚本
; 用于自定义 Windows 安装程序的安装过程

; 安装前检查
Function .onInit
  ; 检查是否已有实例在运行
  System::Call 'kernel32::CreateMutex(i 0, i 0, t "DHC_AC_Installer_Mutex") i .r1 ?e'
  Pop $R0
  StrCmp $R0 0 +3
    MessageBox MB_OK|MB_ICONEXCLAMATION "安装程序已在运行中！"
    Abort
FunctionEnd

; 自定义欢迎页面（使用 HTML）
!macro customWelcomePage
  ; 注意：NSIS 原生不支持 HTML 页面，但可以通过插件实现
  ; 这里我们使用标准的 NSIS 页面，但可以自定义文本
  !insertmacro MUI_PAGE_WELCOME
!macroend

; 安装完成后的操作
Function .onInstSuccess
  MessageBox MB_YESNO|MB_ICONQUESTION "安装完成！是否立即启动 DHC AC Installer？" IDNO skip
    Exec '"$INSTDIR\${PRODUCT_FILENAME}.exe"'
  skip:
FunctionEnd

; 卸载前的操作
Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "确定要卸载 ${PRODUCT_NAME} 吗？" IDYES +2
  Abort
FunctionEnd

; 卸载完成后的操作
Function un.onUninstSuccess
  MessageBox MB_ICONINFORMATION|MB_OK "${PRODUCT_NAME} 已成功从您的计算机中卸载。"
FunctionEnd
