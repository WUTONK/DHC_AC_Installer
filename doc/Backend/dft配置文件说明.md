# dft.json 配置文件说明

> **🔒 本文档是 `dft.json` 字段定义的唯一权威来源。**  
> 其他文档（如 `OVERRIDE_CONTROL.md`、`modInstall/README.md`）中如涉及相同字段，应以本文档为准或直接链接到此处。

> **文档版本**: v1.1  
> **最后更新**: 2026-04-28  
> **对应代码**: `DHC_Backend/models/service/decompression/dft.go` + `overrideControl.go`  
> **面向读者**: 模组制作者、开发者、接管项目的 AI  
> **相关文档**:  
> - [OverrideControl 实现参考](../../DHC_Backend/models/service/decompression/OVERRIDE_CONTROL.md)  
> - [模组安装系统文档](../../DHC_Backend/models/service/modInstall/README.md)  
> - [配置文件模板](ConfigurationFileTemplate/dhcFileTag_template.json)

---

## 一、什么是 dft.json

`dft.json`（DHC File Tag）是模组的**安装规则配置文件**，用于告诉安装引擎：

- 这是什么类型的模组（车/地图/HUD）
- 文件解压后应该覆盖到游戏目录的哪个位置
- 对特定文件/目录执行什么操作（覆盖、跳过、备份、重命名等）

每次安装**只处理一个压缩包**（或一个已解压的目录），`dft.json` 的 rules 只对该压缩包解压后的文件树生效。

---

## 二、文件结构

```json
{
    "modType": "car",
    "defaultAction": { "action": "overwrite", "backup": false },
    "rules": [
        { "pattern": "*.txt", "action": "skip", "backup": false },
        { "pattern": "old_data.acd", "action": "rename", "newName": "data.acd", "backup": false },
        { "pattern": "skins/**", "action": "overwrite", "backup": true }
    ],
    "overwriteStartingDir": "content"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `modType` | string | 是 | 模组类型，目前支持 `"car"` / `"map"` / `"dashboard"`（需小写），用于日志、备份目录命名 |
| `defaultAction` | object | 是 | 当文件未命中任何 rule 时的兜底操作 |
| `defaultAction.action` | string | 是 | 默认动作，**不允许使用 `rename`**（因为 rename 需要 newName，无法作为通用默认） |
| `defaultAction.backup` | bool | 是 | 是否触发备份目录创建 |
| `rules` | array | 否 | 规则列表，按 pattern 匹配文件并执行对应操作，可为空数组 `[]` 或省略 |
| `overwriteStartingDir` | string | 否 | 安装目标的起始路径（相对于 AC 游戏根目录），缺省值为 `"content"` |

---

## 三、Rules 规则详解

### 3.1 规则结构

```json
{
    "pattern": "*.txt",
    "action": "backup",
    "backup": true,
    "newName": "",
    "target": ""
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `pattern` | string | 匹配模式（详见 3.2） |
| `action` | string | 匹配后执行的操作（详见 3.3） |
| `backup` | bool | 是否触发备份目录创建（与 action 无关，仅控制是否预先创建备份文件夹） |
| `newName` | string | 仅 `action: "rename"` 时有效，指定重命名后的文件名 |
| `target` | string | **目标相对路径**（相对 `dstDirPath` = 游戏根 + `overwriteStartingDir`）。命中该条 rule 的节点，安装目标为 `dstDirPath + target`；**子级**在「规则 target + 子目录名」链上继承，等价于把源子树重映射到 `target/...` 下（常用来去掉压缩包多包的一层名，如 `shmnc129/content` → `content`） |

### 3.2 Pattern 匹配规则

pattern 按**解压后的文件树相对路径**进行匹配（根目录为 `"."`）。匹配行为取决于 pattern 的格式：

| Pattern 格式 | 匹配方式 | 示例 |
|-------------|---------|------|
| `*.ext`（不含 `/`） | **仅匹配文件名**，任意深度的同名文件都会命中 | `*.txt` 匹配所有目录下的 `.txt` 文件 |
| `dir/*` | 匹配 `dir` 下的**直接子项**（不递归） | `cars/*` 匹配 `cars/r34` 但不匹配 `cars/r34/data.acd` |
| `dir/**` | **递归匹配** `dir` 下的所有文件和子目录（含 `dir` 自身） | `cars/**` 匹配 `cars` 及其下的一切 |
| `path/to/file` | 精确匹配（使用 `filepath.Match` glob 语法） | `cars/r34/data.acd` 只匹配该路径 |
| `dirname`（不含 `/` 和通配符） | 精确匹配该名称的**文件或目录** | `sound` 匹配根目录下名为 `sound` 的节点 |

> **注意**：pattern 的前导 `/` 会被自动去除，所以 `/sound` 和 `sound` 效果相同。

**重要规则**：每个文件/目录**最多只能命中一条规则**。如果同一节点命中多条规则，安装引擎会报错（规则冲突）。

### 3.3 Action 操作类型

| Action | 说明 | 能否作为 defaultAction |
|--------|------|----------------------|
| `overwrite` | 将源文件/目录复制到目标位置，已存在则覆盖 | 可以 |
| `skip` | 跳过，不做任何操作 | 可以 |
| `backup` | 在备份目录中创建对应文件夹（当前实现仅创建目录结构，不复制旧文件） | 可以 |
| `rename` | 先复制到目标位置，再重命名为 `newName` 指定的文件名 | **不可以** |
| `ask` | 询问用户（TODO：尚未实现） | 可以 |

### 3.4 决策优先级

对每个文件/目录节点，按以下优先级确定最终操作：

```
规则命中 > 父节点继承 > defaultAction
```

1. **规则命中**：节点路径匹配了某条 rule → 使用该 rule 的 action
2. **继承父节点**：未命中规则，但父目录有决策 → 继承父目录的 action（**`rename` 不会被继承**）
3. **默认操作**：既无规则命中也无可继承的父决策 → 使用 `defaultAction`

---

## 四、执行流程

```
压缩包
  │
  ▼
① 解压到临时目录（resources/cache/{modType}/{basename}/）
  │
  ▼
② 构建目录树（buildTree）
  │  将解压后的所有文件/目录组织为内存树结构
  │
  ▼
③ 应用决策（applyDecisions）
  │  遍历树中每个节点，按 "规则 > 继承 > 默认" 确定操作
  │
  ▼
④ 剪枝（pruneTree）
  │  若整棵子树操作完全一致，上提为目录级整体操作（减少 I/O 次数）
  │
  ▼
⑤ 生成执行计划（generateExecutionPlan）
  │  输出 Task 列表：每个 Task 包含 路径、操作、目标
  │
  ▼
⑥ 执行计划（ComplyTask）
     按 Task 列表逐一执行 复制/跳过/备份/重命名
```

---

## 五、dft.json 的查找机制

安装引擎按以下优先级查找 `dft.json`（优先级从高到低）：

```
resources/{type}/{pkg}/{mod}/dft.json    ← mod 级别（最高优先级）
resources/{type}/{pkg}/dft.json          ← pkg 级别
resources/{type}/dft.json                ← 大类级别（最低优先级）
```

这意味着：
- 每个 mod 可以有自己独立的 `dft.json`
- 如果没有，向上查找 pkg 级别的 `dft.json`（同一 pkg 下的所有 mod 共享）
- 如果还没有，查找大类级别的 `dft.json`（同一 type 下的所有 mod 共享）

如果压缩包内自带 `dft.json`（`DftPathFromCompressRoot` 模式），则直接使用解压后根目录中的 `dft.json`。

---

## 六、overwriteStartingDir 说明

`overwriteStartingDir` 决定解压后的文件树安装到游戏目录的哪个位置。

**计算方式**：`目标路径 = 游戏根目录 + overwriteStartingDir`

| overwriteStartingDir | 实际目标目录 | 典型用途 |
|---------------------|------------|---------|
| `"content"` (或缺省) | `{gamePath}/content/` | 大多数模组 |
| `"content/cars"` | `{gamePath}/content/cars/` | 车辆模组（解压后直接是车辆文件夹） |
| `"."` | `{gamePath}/` | 压缩包内已包含完整的目录结构（如 `content/tracks/...`） |

---

## 七、关于多压缩包的行为

### 核心规则：一次安装 = 一个压缩包

每次调用 `SingleModInstall` 只处理**一个**压缩包或一个已解压的目录。

| 场景 | 行为 |
|------|------|
| mod 目录下有一个压缩包 | 正常解压并应用 rules |
| mod 目录下有多个独立压缩包（car1.rar + car2.rar） | **只处理找到的第一个**，其余被忽略 |
| 多卷压缩包（.part1.rar + .part2.rar） | 7z 自动识别为一个整体，解压后统一应用 rules |
| mod 目录下无压缩包（已解压的文件） | 走 `SingleModInstallFromDir`，对整个目录应用 rules |

**注意**：如果一个 mod 目录下放了 `car1.rar` 和 `car2.rar`，**只有第一个会被安装**，第二个包中的所有文件（包括匹配 rules 的文件）都不会被处理。

如果需要安装多个压缩包，应将它们放在**不同的 mod 目录**下，分别配置 `dft.json`：

```
cars/
├── pkg1/
│   ├── car1/
│   │   ├── dft.json
│   │   └── car1.rar
│   └── car2/
│       ├── dft.json
│       └── car2.rar
```

---

## 八、完整示例

### 示例 1：基础车辆模组

```json
{
    "modType": "car",
    "defaultAction": { "action": "overwrite", "backup": false },
    "rules": [],
    "overwriteStartingDir": "content/cars"
}
```

效果：解压后的所有文件直接覆盖到 `{gamePath}/content/cars/` 下，不做备份。

### 示例 2：带规则的车辆模组

```json
{
    "modType": "car",
    "defaultAction": { "action": "overwrite", "backup": false },
    "rules": [
        { "pattern": "cars/r34/old_data.acd", "action": "rename", "newName": "data.acd", "backup": false },
        { "pattern": "*.txt", "action": "skip", "backup": false }
    ],
    "overwriteStartingDir": "content"
}
```

效果：
- `cars/r34/old_data.acd` → 复制到目标后重命名为 `data.acd`
- 所有 `.txt` 文件 → 跳过不安装
- 其他文件 → 默认覆盖

### 示例 3：地图模组（压缩包内含完整路径）

```json
{
    "modType": "map",
    "defaultAction": { "action": "overwrite", "backup": false },
    "rules": [],
    "overwriteStartingDir": "."
}
```

效果：压缩包内部结构为 `content/tracks/mapName/...`，安装到 `{gamePath}/` 下，路径自动对齐。

### 示例 4：选择性安装

```json
{
    "modType": "car",
    "defaultAction": { "action": "skip", "backup": false },
    "rules": [
        { "pattern": "data/**", "action": "overwrite", "backup": false },
        { "pattern": "skins/**", "action": "overwrite", "backup": true }
    ],
    "overwriteStartingDir": "content/cars"
}
```

效果：
- 默认跳过所有文件
- 只安装 `data/` 和 `skins/` 目录下的内容
- `skins/` 安装前会创建备份目录

### 示例 5：去掉多余包裹层（target 重映射）

压缩包解压后结构为 `shmnc129/content/cars/r34/...`，期望安装到 `{gamePath}/content/cars/r34/...`。

```json
{
    "modType": "car",
    "defaultAction": { "action": "skip", "backup": false },
    "rules": [
        { "pattern": "shmnc129/content", "action": "overwrite", "target": "content", "backup": false }
    ],
    "overwriteStartingDir": "."
}
```

效果：
- `overwriteStartingDir` 设为 `"."`，即 `dstDirPath = {gamePath}`
- 规则命中 `shmnc129/content`，将其重映射到 `{gamePath}/content`
- 子目录 `shmnc129/content/cars`（没有单独规则）自动继承，安装到 `{gamePath}/content/cars`
- 根目录 `shmnc129` 和其他未命中规则的节点走 `defaultAction: skip`，被跳过

---

## 九、注意事项

1. **`rename` 不能作为 `defaultAction`**：因为 rename 需要指定 `newName`，不能作为通用默认操作。
2. **`rename` 不会被子节点继承**：如果一个目录被 rename，其子节点不会自动继承 rename，而是回退到 `defaultAction`。
3. **规则不能冲突**：同一文件/目录不能命中两条及以上 rules，否则会报错。
4. **JSON 中的 `//` 注释**：`dft.json` 模板中使用 `"//"` 键作为注释，这不是标准 JSON，但 Go 的 `json.Unmarshal` 会忽略未声明的字段，所以不影响解析。
5. **`backup` 的当前实现**：`backup` 字段和 `action: "backup"` 目前仅创建备份目录结构（`resources/backup/{modType}/...`），**不会自动复制目标位置的旧文件**。真正的文件备份功能是 TODO 状态。
6. **剪枝优化**：如果一个目录下所有文件的操作完全一致，安装引擎会将它们合并为一次目录级操作（例如整个目录一次性覆盖），减少 I/O 次数。
