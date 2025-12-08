# 更新总结 #133

**本次更新**: 新增欢迎页面（WelcomePage）包含一键安装引导、磁盘可视化、智能盘符推荐；添加地区切换功能（自动检测+手动切换中国/美国）；资源管理添加一键清除功能；修复Tag和Collapse组件问题

**上一次 commit**: `1773852` - 更新decompression.ditSet 按照优先级：1. SSD > HDD  2. 固定设备 > 可拔插设备  3. 剩余空间大小 处理推荐设备顺序，添加infoget.getDiskInfo():使用powershell来获取磁盘信息

---

## 📦 新增文件

- `DHC_Frontend/src/renderer/src/WelcomePage.tsx` (561行)
  - 欢迎页面：一键安装入口、功能导航、视频教程、磁盘检测与配置
- `DHC_Backend/test/unitTest/models/service/decompression/dirSet_test.go` (576行)
  - dirSet 单元测试
- `changelog/133_UPDATE_SUMMARY.md` + `changelog/README.md`
  - 更新总结文档

## 🔧 修改文件

- `DHC_Frontend/src/renderer/src/App.tsx` (+102行)
  - 添加地区切换功能（自动检测+手动切换）
  - 集成 WelcomePage 到 Home 路由

- `DHC_Frontend/src/renderer/src/ResourceImportManager.tsx` (+137行)
  - 添加一键清除所有资源按钮及确认弹窗
  - 修复 Tag icon 属性、Collapse.Panel itemKey 问题

- `DHC_Frontend/src/renderer/src/assets/main.css` (-71行)
  - 样式优化清理

## 🎯 主要功能

- 欢迎页面：一键安装引导、磁盘可视化、智能盘符推荐
- 地区切换：自动检测语言、手动切换（中国/全球）、影响视频链接
- 资源管理：一键清除资源（带确认弹窗）

