# sevenzipbootstrap_simple

一个简化的 7-Zip 工具下载和安装包，专门用于下载 7-Zip 25.01 版本。

## 功能特点

- **固定版本**: 专门下载 7-Zip 25.01 版本，无需版本检测
- **跨平台支持**: 支持 Windows、macOS、Linux
- **自动检测**: 优先使用已安装的 7z，避免重复下载
- **SHA256 校验**: 可选的下载文件完整性验证
- **简化接口**: 相比完整版，移除了版本比较和自动检测功能

## 主要函数

### EnsureSevenZipSimple

```go
func EnsureSevenZipSimple(installDir string, sha256 string) (string, error)
```

确保在指定目录下存在可用的 7z 可执行文件（25.01版本）。

**参数:**
- `installDir`: 7z 可执行文件的安装目录路径
- `sha256`: SHA256 校验值，空字符串表示不进行校验

**返回值:**
- `string`: 7z 可执行文件的绝对路径
- `error`: 如果安装失败则返回错误

## 使用示例

```go
package main

import (
    "fmt"
    "log"
    "path/filepath"
    
    sevenZipBootStrapSimple "DHC_Backend/pkg/sevenzipbootstrap_simple"
)

func main() {
    // 设置安装目录
    installDir := filepath.Join(".", "7zip_install")
    
    // 可选：提供 SHA256 校验值
    sha256 := "" // 可以填入实际的 SHA256 值进行校验
    
    // 下载并安装 7-Zip 25.01
    sevenZipPath, err := sevenZipBootStrapSimple.EnsureSevenZipSimple(installDir, sha256)
    if err != nil {
        log.Fatalf("下载/安装 7-Zip 失败: %v", err)
    }
    
    fmt.Printf("7-Zip 安装成功！路径: %s\n", sevenZipPath)
}
```

## 测试 API

包提供了 `TestApi` 结构体用于测试，包含以下方法：

- `BuildDownloadSpec(sha256 string)`: 构建下载规格
- `CandidateName()`: 获取候选文件名
- `FindPrivate7z(dir string)`: 在目录中查找 7z
- `VerifySHA256(path, want string)`: 验证 SHA256
- `GetTargetVersion()`: 获取目标版本 (25.01)
- `GetVersionCode()`: 获取版本代码 (2501)

## 运行测试

```bash
cd DHC_Backend
go test ./test/pkg/sevenzipbootstrap_simple/... -v
```

## 与完整版的区别

| 功能 | 完整版 | 简化版 |
|------|--------|--------|
| 版本检测 | ✅ 自动检测最新版本 | ❌ 固定 25.01 版本 |
| 版本比较 | ✅ 支持版本比较 | ❌ 无版本比较 |
| 最低版本要求 | ✅ 支持 | ❌ 不支持 |
| 下载功能 | ✅ 完整 | ✅ 完整 |
| SHA256 校验 | ✅ 支持 | ✅ 支持 |
| 跨平台支持 | ✅ 支持 | ✅ 支持 |
| 代码复杂度 | 高 | 低 |

## 依赖

- `github.com/ulikunitz/xz`: 用于解压 .xz 文件
- 标准库: `archive/tar`, `crypto/sha256`, `net/http`, `os`, `os/exec` 等

## 许可证

与主项目相同的许可证。
