# OverrideControl（覆盖控制）使用说明

> **注意**：本文档为代码级实现参考。  
> **`dft.json` 字段权威定义**请以 [`doc/Backend/dft配置文件说明.md`](../../../../doc/Backend/dft配置文件说明.md)（以下简称「主文档」）为准，两份文档如有冲突以主文档为准。

把**解压后的模组目录**按 **DFT（`dft.json`）** 里的规则，复制到**游戏目录下的某根路径**（通常是 `content` 或 `content/cars` 等）。  
核心流程：**扫描源目录树 → 给每个文件/目录选动作（规则 > 继承父目录 > 默认）→ 剪枝合并同类子树 → 生成任务并执行**。

---

## 函数签名

```go
decompression.OverrideControl(srcDirPath, dstDirPath, dftJsonPath string) error
```

| 参数 | 含义 |
|------|------|
| `srcDirPath` | 解压产物根目录（磁盘上的绝对/相对路径） |
| `dstDirPath` | **安装目标根**：一般为 `filepath.Join(游戏根, OverwriteStartingDir)`，例如 `…/Assetto Corsa/content` |
| `dftJsonPath` | 覆盖规则 JSON 的路径（与 `DecodeDhcFileTagConfig` 相同格式） |

与 `modInstall.SingleModInstall` 一致时：`dstDirPath` 不要只传游戏根目录，必须带上 DFT 里的 `overwriteStartingDir`（缺省为 `content`）。

---

## DFT JSON 字段（`dft.go`）

```json
{
  "modType": "car",
  "defaultAction": { "action": "overwrite", "backup": false },
  "rules": [
    { "pattern": "cars/**", "action": "overwrite", "backup": false, "newName": "" }
  ],
  "overwriteStartingDir": "content"
}
```

| 字段 | 说明 |
|------|------|
| `modType` | 模组类型字符串；备份目录会分类型存放（见 `Backup`） |
| `defaultAction.action` | 未命中任何 `rules`、且不继承父目录决策时的动作 |
| `defaultAction.backup` | 若为 true，会在安装前走一版「备份目录」逻辑（见下方限制） |
| `rules` | 可选；每条对**相对 `srcDirPath` 的路径**（统一用 `/` 逻辑）做模式匹配 |
| `rules[].pattern` | Glob；见下一节 |
| `rules[].action` | 对该节点执行的动作 |
| `rules[].backup` | 该规则命中且为 true 时，参与「是否需要先建备份目录」的判断 |
| `rules[].newName` | **仅当 `action` 为 `rename` 时**：复制到目标后的文件名 |
| `rules[].target` | **目标相对路径**（相对 `dstDirPath`）。命中该规则的节点安装到 `dstDirPath + target`；**子节点沿继承链追加自身目录名**（详见下方「target 重映射」）|
| `overwriteStartingDir` | 相对**游戏安装根**的子路径；**空则默认为 `content`**（由 `DecodeDhcFileTagConfig` 处理） |

注意：`defaultAction.action` **不能**是 `rename`（会报错）；`rename` 只能出现在规则里，且语义偏「单文件：先覆盖复制再改名」。

---

## `pattern` 怎么写（`DirectoryMatching`）

路径都是相对 **`srcDirPath`** 的根来算的（树里根是 `"."`，第一层子目录如 `cars/...`）。

- **`dir/**`**：递归匹配该前缀下任意层文件与目录；`dir` 自身也可命中。
- **`dir/*`**：只匹配**直接**在 `dir` 下的**文件**（路径中不能再出现下一层 `/` 目录）。
- **不含 `/` 的模式**（如 `*.cfg`）：只对**文件名**做 `filepath.Match`，等价于「任意目录下的该文件名」。
- **其它**：按 `filepath.Match` 做路径匹配（`*` 不跨目录）。

多规则命中**同一节点**会报错（「规则冲突」）。

---

## `target` 重映射与继承

`rules[].target` 用于将命中节点「重定向」到游戏目录下的另一相对路径，常见场景是**去掉压缩包里多余的包裹层**。

### 示例：去掉多余包裹层

假设：
- 压缩包解压后结构为 `shmnc129/content/cars/r34/...`
- 期望安装到 `{gamePath}/content/cars/r34/...`
- `overwriteStartingDir` 设为 `"."`（即 `dstDirPath = {gamePath}`）

配置：
```json
{ "pattern": "shmnc129/content", "action": "overwrite", "target": "content" }
```

效果：
- 源路径 `shmnc129/content` → 安装到 `{gamePath}/content`
- 源路径 `shmnc129/content/cars`（**没有单独的规则命中它**）→ 自动继承父节点的 target，计算得 `content/cars` → 安装到 `{gamePath}/content/cars`

### 继承规则（代码见 `applyDecisions`）

**只有当子节点没有命中任何规则时**，才会继承父节点的 target：
- 继承计算：`子 target = filepath.Join(父 target, 子目录名)`
- 如果子节点**命中了自己的规则**（哪怕规则里没写 target），就**不会继承**父的 target，而是用规则里的 target（空则按源路径原样写入）

### 注意

`target` 为空（或不写）表示「按源相对路径原样写入」，即最终路径 = `dstDirPath + 源文件的 relPath`。

---

## 动作（`action`）含义

| 值 | 行为（简化） |
|----|----------------|
| `overwrite` | 目录：删目标同名目录后整棵复制；文件：复制覆盖 |
| `skip` | 不复制 |
| `backup` | 当前实现对任务调用 `Backup`（见下方限制） |
| `rename` | 先按 `overwrite` 复制到 `Target`，再把目标文件改名为 `newName`（缺 `newName` 会失败） |
| `ask` | 当前为占位：任务里相当于跳过 |

**继承**：若某节点**没有**命中规则，且父目录在规划阶段已有决策，则子节点**继承**父节点的 `action`（**父节点是 `rename` 时不继承**）。

---

## 目标路径怎么拼（`buildTarget`）

最终目标路径由 `buildTarget(dstRoot, relPath, decidedTarget, srcDirName)` 计算：

1. **若 `decidedTarget` 非空**（规则命中或继承得到）：`Target = filepath.Join(dstRoot, decidedTarget)`。
2. **若 `decidedTarget` 为空**：
   - `relPath == "."` 时：`Target = dstRoot`（根节点合并到目标根）。
   - 否则：`Target = filepath.Join(dstRoot, relPath)`（按源相对路径原样写入）。

**典型调用链**：`dstRoot = filepath.Join(gamePath, overwriteStartingDir)`，例如 `…/Assetto Corsa/content`。

**注意**：`srcDirPath` 的内部布局应与「期望在游戏目录中出现的相对结构」一致；若有多余包裹层，需使用 `rules[].target` 重映射去掉。

---

## 与 `modInstall` 的配合

典型调用链：

1. `DecodeDhcFileTagConfig(dftPath)` 读 `overwriteStartingDir`
2. `overrideDstFile := filepath.Join(gamePath, overwriteDir)`
3. `OverrideControl(unDecompressionPath, overrideDstFile, dftPath)`

`dftPath` 由 `GetDftPath` 等逻辑从解压目录或资源目录解析，不必与 `srcDirPath` 同目录，但必须是**同一次安装**使用的的那份 DFT。

---

## 示例 DFT

**整包默认跳过，只覆盖 `cars` 下所有内容：**

```json
{
  "modType": "car",
  "defaultAction": { "action": "skip", "backup": false },
  "rules": [
    { "pattern": "cars/**", "action": "overwrite", "backup": false }
  ],
  "overwriteStartingDir": "content"
}
```

仓库内参考：`overrideControlExample/dft/dhcOverrideControlSimple.json`。

---

## 当前实现需注意的限制

1. **`ComplyTask` 的错误**：`OverrideControl` 末尾未检查 `ComplyTask` 的返回值，安装失败时可能仍返回 `nil`（建议在调用链上补上）。
2. **`Backup`**：主要用于在 `resources/backup/...` 下创建版本化目录；与「把即将被覆盖的游戏文件拷贝进备份」的完整产品语义相比，代码里仍有 TODO，使用 `backup: true` 前请对照 `overrideControl.go` 里 `Backup` / `ComplyTask` 实现确认是否满足预期。
3. **DFT 与 `DhcFileTag`**：`DhcFileTagIdentify` 用的 JSON 只有 `ModType` 字段；**覆盖配置**需使用本文所述的 **`DhcFileTagConfig`** 全量字段（`modType`、`defaultAction`、`rules` 等）。两者用途不同，不要混用一个文件格式。

---

## 单测参考

- `test/unitTest/models/service/decompression/overrideControl_test.go`：`OverrideControl` 集成测、`DirectoryMatching` 用例。
- 路径匹配行为以 `TestDecodeDhcFileTagConfig`（实为 `DirectoryMatching` 测试）里的表为准。
