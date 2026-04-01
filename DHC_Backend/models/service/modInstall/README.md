# DHC 模组安装系统使用文档

本文档说明了 DHC 模组安装系统的底层设计、目录结构约束以及如何正确使用相关 API 进行模组的导入、检测与安装。

## 1. 核心概念与目录结构

整个安装系统围绕着 **"资源库 (Resources)"** 和 **"三级路径"** 展开。

### 1.1 三级路径规范
系统中的所有模组必须严格遵循三级路径的组织形式：
`{ResourceType}/{PkgName}/{ModName}`

- **ResourceType (资源类型)**: 必须是 `cars`、`tracks`、`shaders`、`dashboard` 之一。
- **PkgName (包名)**: 模组所属的包或分类（例如 `shmc`）。
- **ModName (模组名)**: 具体的模组标识（例如 `r34`）。

**合法示例**: `cars/shmc/r34`

### 1.2 资源库目录结构
在开发模式下，资源库位于 `test/simEnv/resources/`（生产环境下在 `resources/`）。
其结构必须与三级路径和 `pkgInfo.json` 严格对应：

```text
resources/
├── pkgInfo.json            # 核心注册表（定义了所有合法的模组及其期望大小）
├── cars/
│   └── shmc/
│       └── r34/
│           ├── dft.json    # 模组配置文件（定义覆盖规则等）
│           └── r34.zip     # 模组压缩包（或已解压的目录）
└── tracks/
    └── ...
```

### 1.3 `pkgInfo.json` (资源注册表)
系统**只认**在 `pkgInfo.json` 中注册过的模组。如果磁盘上有文件但 `pkgInfo.json` 里没写，系统会报警并忽略。
它的结构如下：
```json
{
  "categorys": {
    "cars": {
      "shmc": {
        "r34": 1024000,     // 值为该模组所有文件的期望总大小(字节)
        "rx7": 2048000
      }
    }
  }
}
```

---

## 2. 核心流程与 API 使用

系统的完整生命周期分为：**引入资源包 -> 状态检测 -> 选择与安装**。

### 2.1 引入资源包 (`DhcResoucePkgImport`)
用于将用户下载的外部大资源包（可能包含多个模组）导入到本地资源库。

```go
// 传入外部压缩包路径，解压并移动到 resources/ 目录下
rm, err := modinstall.DhcResoucePkgImport("/path/to/downloaded_pkg.zip")
```
**内部行为**:
1. 解压到临时目录 `importResourceCache`。
2. 扫描临时目录，与 `pkgInfo.json` 比对，生成 `ResourceMap`。
3. 将文件移动到正式的 `resources/` 目录。
4. 清理临时目录。

### 2.2 资源状态检测 (`ImportResourceDetection`)
用于扫描本地资源库，判断哪些模组已安装、哪些缺失或不完整。前端展示的资源树数据就是从这里来的。

```go
// 获取本地所有资源的状态
rm, err := modinstall.ImportResourceDetection(modinstall.All, modinstall.Local)

// 转为 JSON 传给前端
jsonStr, _ := modinstall.ResourceMapToJson(rm)
```
**状态判定规则**:
- **NotImported**: 磁盘上没有该模组的文件，或总大小为 0。
- **Incomplete**: 磁盘上有文件，但总大小 < `pkgInfo.json` 中定义的期望大小。
- **Pass**: 磁盘上文件总大小 >= 期望大小（只有 Pass 状态才允许安装）。

### 2.3 批量安装模组 (`MultiModInstall`)
这是向游戏目录（`content/`）实际写入模组的入口。

```go
// 传入要安装的路径列表（支持一级、二级、三级路径）
paths := []string{
    "cars/shmc/r34",  // 精确安装 r34
    "tracks/c1",      // 展开并安装 c1 包下的所有赛道
}
dftFilePath := "" // 全局默认的 dft 配置文件路径（如果模组自带则优先用自带的）

err := modinstall.MultiModInstall(paths, dftFilePath)
```
**内部行为**:
1. **展开路径**: 将 `tracks/c1` 展开为底层的三级路径（如 `tracks/c1/inner`, `tracks/c1/outer`）。
2. **完整性检查**: 检查展开后的所有三级路径在本地资源库中是否都是 `Pass` 状态。如果有 `Incomplete` 或 `NotImported`，直接报错拒绝安装。
3. **执行安装**: 遍历合法路径，在对应的 `resources/...` 目录下寻找压缩包（`.zip/.rar/.7z`）。
   - 找到压缩包 -> 解压到中间目录 -> 根据 `dft.json` 复制到游戏目录。
   - 没找到压缩包但有文件夹 -> 直接根据 `dft.json` 复制到游戏目录。

---

## 3. 常见问题与避坑指南

### 3.1 为什么我的模组没有被检测到？
1. **未在 `pkgInfo.json` 注册**: 检查 `pkgInfo.json` 中是否添加了对应的 `ResourceType -> Pkg -> Mod` 层级。
2. **目录层级不对**: 必须严格是 `resources/类型/包名/模组名/文件`。例如 `resources/cars/mycar.zip` 是错误的，缺少了 `pkg` 层级。
3. **大小不达标**: 检查 `pkgInfo.json` 里配置的字节数是不是比实际文件大，导致状态变成了 `Incomplete`。

### 3.2 同一个模组目录下可以放多个压缩包吗？
**不建议**。
`MultiModInstall` 在处理目录时，使用的 `findModFileInDir` 函数只会返回它找到的**第一个**压缩包。如果一个模组（如 `cars/shmc/r34`）目录下放了 `part1.zip` 和 `part2.zip`，系统只会安装其中一个。
**正确做法**: 将它们合并为一个压缩包，或者作为已解压的普通文件夹存放在该目录下。

### 3.3 `dft.json` 放在哪？
`dft` 是历史命名 `dhcFileTag` 的缩写。现在系统在安装时统一读取 `dft.json`，用它决定：
- 模组类型 `modType`
- 覆盖规则 `rules`
- 目标目录 `overwriteStartingDir`

系统在安装时会寻找 `dft.json` 来决定覆盖规则和目标目录（`OverwriteStartingDir`）。
- **优先级 1**: 模组压缩包内部的根目录或源文件夹根目录。
- **优先级 2**: 调用 `MultiModInstall` 时传入的 fallback 路径。

### 3.4 `modType` 还需要手写吗？
需要。当前 `dft.json` 里的 `modType` 是**必填字段**，系统不会根据目录自动推导资源类型。

这样做的原因是：

- 配置语义更明确，排查问题时不用再反推目录规则。
- 避免为少量填写便利引入额外的隐式推导逻辑。
- 当前工作流下通常由 AI 生成 `dft.json`，显式填写 `modType` 的成本很低。

建议始终显式填写标准资源类型值，例如：

- `cars`
- `tracks`
- `shaders`
- `dashboard`

### 3.5 测试环境的重置
开发过程中如果游戏目录（`content/`）被污染，可以使用以下函数恢复到骨架状态：
```go
// 将 simEnv/acRoot/Assetto Corsa/content 重置为 envBackup 中的状态
modinstall.ResetSimEnvModDirectories()
```