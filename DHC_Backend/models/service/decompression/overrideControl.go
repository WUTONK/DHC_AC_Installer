package decompression

import (
	"DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/servicelog"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type OverrideAction string

const (
	OverrideActionOverwrite OverrideAction = "overwrite" // 覆盖
	OverrideActionSkip      OverrideAction = "skip"      // 跳过
	OverrideActionBackup    OverrideAction = "backup"    // 备份后覆盖
	OverrideActionRename    OverrideAction = "rename"    // 重命名
	OverrideActionAsk       OverrideAction = "ask"       // 询问用户
)

type override interface {
	overwrite() error
	skip() error
	backup() error
	rename() error
	ask() error
}

type OverrideStruct struct {
}

// Node 用于构建源目录树并承载决策信息
type Node struct {
	// relPath: 相对 src 根目录的路径（以 "." 为根）。
	// 例如：".", "cars", "cars/ddm_toyota/.../sfx/GUIDs.txt"
	relPath  string
	isDir    bool
	children []*Node

	// 决策标注：规划/决策阶段输出的最终动作与来源
	// hasDecision: 是否已有最终决策（true 表示本节点将产生任务或由父节点统领）
	// decidedAction: 最终动作（overwrite/skip/backup/rename/ask）
	// decidedTarget: 目标相对路径（为空则等于 relPath；未来支持映射时会使用）
	// decidedSource: 决策来源（"rule" | "inherit" | "default"）
	// newName: 要将符合规则的文件重命名为的名称
	hasDecision   bool
	decidedAction OverrideAction
	decidedTarget string
	decidedSource string // rule | inherit | default
	newName       string // 重命名后的文件名（仅当 decidedAction == OverrideActionRename 时有效）
}

// Task 计划项（此阶段仅输出计划，不实际执行 I/O）
type Task struct {
	// Path: 源相对路径（与 Node.relPath 一致）
	// Action: 计划执行的动作
	// Target: 目标完整路径（在 generateExecutionPlan 中通过 buildTarget 函数将 dstRoot 与目标相对路径拼接而成）
	//         - 若 decidedTarget 不为空：Target = dstRoot + decidedTarget
	//         - 若 decidedTarget 为空：Target = dstRoot + relPath
	//         注意：此字段存储的是完整路径，而非相对路径，可直接用于文件操作
	// IsDir: 是否为目录级任务（目录级任务生成后会剪枝，避免对子项重复执行）
	Path     string
	Action   OverrideAction
	Target   string
	IsDir    bool
	IsBackup bool
	NewName  string
	// TODO: 处理需要备份的情况（在现在backup属于一个单独的action操作 而不是附带操作）
	// 重命名仅仅支持单一文件级（某一文件或某一文件夹），需要添加检测逻辑
	// 上分支如果重命名 会导致路径是旧的
	// -解决方案1:在生成任务树后，从底向上查找是否有rename dir任务，如果有，那么根据rename改变目标路径
	// 			拆分得到 path[]string ，然后查找层级，根据rename层级改变relDstPath
	// 			例如 car/a/b -> recar/a/b 我在第三层
	// 			base改变 relPath = newRelPath := path[:nowClass-2]+relPath[nowClass-1:]
	//那么如果有car/a/b/c呢 这个时候变成了recar/a/b/c 查看上级目录是否和自己对得上 对不上就执行一样的逻辑

	// TODO:添加覆盖到某个特定路径的支持
}

// Overwrite 覆盖文件或目录
// 如果源路径是文件，则复制文件；如果是目录，则递归复制整个目录
// 如果目标文件/目录不存在，它会被创建
func (o OverrideStruct) Overwrite(srcPath, dstPath string) error {
	funcIdt := "-service.decompression.Overwrite-"

	// 检查源路径是文件还是目录
	srcInfo, err := os.Stat(srcPath)
	if err != nil {
		return fmt.Errorf("%s无法获取源路径信息: %v", funcIdt, err)
	}

	if srcInfo.IsDir() {
		// 目录处理：递归复制整个目录
		// 确保目标目录的父目录存在
		if err := os.MkdirAll(filepath.Dir(dstPath), os.ModePerm); err != nil {
			return fmt.Errorf("%s创建目标目录父目录失败: %v", funcIdt, err)
		}

		// 使用 filepath.WalkDir 递归复制
		err := filepath.WalkDir(srcPath, func(srcFilePath string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}

			// 计算相对路径
			relPath, err := filepath.Rel(srcPath, srcFilePath)
			if err != nil {
				return err
			}
			dstFilePath := filepath.Join(dstPath, relPath)

			if d.IsDir() {
				// 创建目标目录
				return os.MkdirAll(dstFilePath, os.ModePerm)
			} else {
				// 复制文件
				// 确保目标目录存在
				if err := os.MkdirAll(filepath.Dir(dstFilePath), os.ModePerm); err != nil {
					return err
				}

				srcFile, err := os.Open(srcFilePath)
				if err != nil {
					return err
				}
				defer srcFile.Close()

				dstFile, err := os.Create(dstFilePath)
				if err != nil {
					return err
				}
				defer dstFile.Close()

				_, err = io.Copy(dstFile, srcFile)
				return err
			}
		})

		if err != nil {
			return fmt.Errorf("%s递归复制目录失败: %s -> %s, err:%v", funcIdt, srcPath, dstPath, err)
		}

		servicelog.Debugf("%s成功复制目录从 %s 到 %s\n", funcIdt, srcPath, dstPath)
		return nil
	}

	// 文件处理：复制单个文件
	srcFile, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("%s无法打开srcfile: %v", funcIdt, err)
	}
	defer srcFile.Close()

	// 确保目标目录存在
	if err := os.MkdirAll(filepath.Dir(dstPath), os.ModePerm); err != nil {
		return fmt.Errorf("%s创建目标目录失败: %v", funcIdt, err)
	}

	dstFile, err := os.Create(dstPath)
	if err != nil {
		return fmt.Errorf("%s无法创建dstfile: %v", funcIdt, err)
	}
	defer dstFile.Close()

	bytesWritten, err := io.Copy(dstFile, srcFile)
	if err != nil {
		return fmt.Errorf("%s无法复制并覆盖srcFile:%s 到 dstFile:%s ,err:%v", funcIdt, srcPath, dstPath, err)
	}

	servicelog.Debugf("%s成功复制 %d 字节从 %s 到 %s\n", funcIdt, bytesWritten, srcPath, dstPath)
	return nil
}
func (o OverrideStruct) Skip() error {
	// funcIdt := "-service.decompression.Skip-"
	return nil
}

// - TODO:处理完备份场景
// - 用户安装失败后 再次安装成功 那么需要删除备份
// - 备份操作应该被显示出来 并且应该被用户手动删除 所以不进行自动垃圾回收（从备份恢复场景以外）
// - 首次安装：无需备份｜重新安装以修复：无需备份｜更新且原版本可用：需要备份
// - 需要提供多备份 用版本号区分
// - 备份被删除后 序列号会乱掉 怎么办

// Backup()接收模组类型和需备份目录路径 并存放在 rootpath/resources/backup/modType/needBackupDirName下
func (o OverrideStruct) Backup(modType string, needBackupPath string) error {
	funcIdt := "-service.decompression.Backup-"

	// 获取后端根目录
	rootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("获取根目录路径失败: %v", err)
	}

	// 从 needBackupPath 提取最后一个路径名
	lastPathName := filepath.Base(needBackupPath)

	// 构造完整路径: rootpath/resources/backup/(modType)/(最后一个路径名)
	localBackupPath := filepath.Join(rootPath, "resources", "backup", modType, lastPathName)

	// 在最后的目录名末尾加上 "_backup"
	localBackupPath = localBackupPath + "_backup"

	// 检查存在目录的版本号 格式：example_backup_01, example_backup_02, ...
	// 获取父目录路径
	parentDir := filepath.Dir(localBackupPath)
	baseName := filepath.Base(localBackupPath)
	// dhc_backup

	// 读取父目录中的所有文件和目录
	entries, err := os.ReadDir(parentDir)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("%s无法读取目录 %s: %v", funcIdt, parentDir, err)
	}

	// 查找所有匹配 baseName_数字 格式的目录
	maxVersion := 0
	pattern := baseName + "_"

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		name := entry.Name()
		// 检查是否以 pattern 开头
		// 匹配 dhc_backup_**
		if strings.HasPrefix(name, pattern) {
			// 提取版本号部分
			versionStr := strings.TrimPrefix(name, pattern)
			// 尝试解析为整数
			if version, err := strconv.Atoi(versionStr); err == nil {
				if version > maxVersion {
					maxVersion = version
				}
			}
		}
	}

	// 生成新的版本号
	var backupDir string
	if maxVersion == 0 {
		// 不存在任何备份，使用 _01
		backupDir = localBackupPath + "_01"
	} else {
		// 存在备份，使用最大版本号+1
		backupDir = fmt.Sprintf("%s_%02d", localBackupPath, maxVersion+1)
	}

	// 创建备份目录
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return fmt.Errorf("%s无法创建备份目录 %s: %v", funcIdt, backupDir, err)
	}

	return nil

}

// 覆盖起始目录

// Rename 将 oldPath 重命名为 newPath
func (o OverrideStruct) Rename(oldPath, newPath string) error {
	funcIdt := "-service.decompression.Rename-"

	// 确保目标目录存在
	targetDir := filepath.Dir(newPath)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return fmt.Errorf("%s无法创建目标目录 %s: %v", funcIdt, targetDir, err)
	}

	// 执行重命名操作
	err := os.Rename(oldPath, newPath)
	if err != nil {
		return fmt.Errorf("%s重命名操作失败: 从 %s 到 %s, 错误: %v", funcIdt, oldPath, newPath, err)
	}

	return nil
}

func (o OverrideStruct) Ask(srcFilePath, dstFilePath string) error {
	// funcIdt := "-service.decompression.Ask-"
	return nil
}

// 将解压后文件复制到目标目录 覆盖/跳过同名项目 支持警告或不警告 被覆盖项目备份和还原 记录重点事件（覆盖信息、覆盖时间戳）
// 源文件目录 目标复制目录 dft文件
func OverrideControl(srcDirPath string, dstDirPath string, dftJsonPath string) error {

	funcIdt := "-service.decompression.overrideControl-"
	o := OverrideStruct{}

	// 解码文件
	config, err := DecodeDhcFileTagConfig(dftJsonPath)
	if err != nil {
		return fmt.Errorf("解码覆盖控制配置文件失败: %v", err)
	}

	// 分离出指定默认属性
	rulesUndefined := false
	defaultAction := config.DefaultAction
	modType := config.ModType
	rules := config.Rules
	if rules == nil {
		rulesUndefined = true
	}
	// 根据开发/生产模式自动获取游戏路径
	servicelog.Debugf("%s正在获取游戏路径...\n", funcIdt)
	_, err = infoGet.GetGamePathAuto()
	if err != nil {
		return fmt.Errorf("%s获取游戏路径失败: %v", funcIdt, err)
	}
	servicelog.Debugf("%s游戏路径获取成功\n", funcIdt)

	// 打印调试信息
	servicelog.Debugf("模组类型: %s\n", modType)
	servicelog.Debugf("默认操作: %s, 备份: %t\n", defaultAction.Action, defaultAction.Backup)
	if !rulesUndefined {
		servicelog.Debugf("规则数量: %d\n", len(rules))
		for i, rule := range rules {
			servicelog.Debugf("规则 %d: 模式=%s, 操作=%s, 备份=%t\n", i+1, rule.Pattern, rule.Action, rule.Backup)
		}
	}

	// 辨别是否存在任何需备份文件（包含默认和指定路径操作）如果是那么创建备份文件夹
	if defaultAction.Backup || func() bool {
		for _, rule := range rules {
			if rule.Backup {
				servicelog.Debugf("规则模式 '%s' 需要备份\n", rule.Pattern)
				return true
			}
		}
		return false
	}() {
		if err := o.Backup(modType, dstDirPath); err != nil {
			return fmt.Errorf("创建备份目录失败: %v", err)
		}
	}

	// 阶段1：构建目录树
	// 将 srcDirPath 下的所有目录/文件以树的形式组织起来；
	// 仅建立结构关系，不做任何动作决策与执行。
	root, buildErr := buildTree(srcDirPath)
	if buildErr != nil {
		return fmt.Errorf("%s构建目录树失败: %v", funcIdt, buildErr)
	}

	// 阶段2：应用决策（规则 > 继承 > 默认），并在冲突时错误
	// 对每个节点：
	// 1) 若命中规则：使用规则动作；若同一节点命中多条规则则报错
	// 2) 否则若父有决策：继承父动作（目录整体动作向下生效）
	// 3) 否则：应用 defaultAction
	var defaultAct OverrideAction
	defaultAct, err = stringToOverrideAction(defaultAction.Action)
	if err != nil {
		return fmt.Errorf("%s默认操作无效: %v", funcIdt, err)
	}
	if applyErr := applyDecisions(root, nil, rules, defaultAct); applyErr != nil {
		return fmt.Errorf("%s应用决策失败: %v", funcIdt, applyErr)
	}

	// 阶段3：剪枝（将完全一致的子树上提为父目录整体动作）
	// 若一个目录的所有后代节点的“(action,target)”完全一致，
	// 则将该动作上提到目录节点，并清空子树的决策（由父目录整体处理），
	// 这样在执行时不会出现“父目录覆盖后子节点再跳过”的无意义操作。
	pruneTree(root)

	// 阶段4：生成执行计划（仅输出计划，暂不执行 I/O）
	// 目录整体任务优先于文件任务；被剪枝的子树不会产生重复任务。
	// 获取源目录名，用于处理根节点（relPath = "."）的情况
	srcDirName := filepath.Base(srcDirPath)
	tasks := generateExecutionPlan(root, dstDirPath, srcDirName)

	// 打印计划摘要
	servicelog.Debugf("%s规划完成：共生成 %d 个任务\n", funcIdt, len(tasks))
	for _, t := range tasks {
		servicelog.Debugf("%s计划: [%s] %s -> %s (dir=%t)\n", funcIdt, t.Action, t.Path, t.Target, t.IsDir)
	}

	// 阶段5: 执行计划
	ComplyTask(srcDirPath, modType, tasks)

	return nil
}

func stringToOverrideAction(str string) (OverrideAction, error) {
	switch str {
	case "overwrite":
		return OverrideActionOverwrite, nil
	case "skip":
		return OverrideActionSkip, nil
	case "backup":
		return OverrideActionBackup, nil
	case "rename":
		return OverrideActionRename, nil
	case "ask":
		return OverrideActionAsk, nil
	default:
		return "", fmt.Errorf("未知的操作类型: %s", str)
	}
}

// DirectoryMatching 目录匹配
// rulePath: 匹配规则路径，支持通配符 * 和 **
// targetPath: 需要匹配的目标路径
// 返回: 是否匹配成功
func DirectoryMatching(rulePath, targetPath string) bool {
	// 标准化路径（统一使用 / 作为分隔符）
	// 规则中的 pattern 允许写成 "/a/b"（与手动路径一致）；relPath 无前导 "/"，需对齐后再匹配
	rulePath = strings.TrimPrefix(filepath.ToSlash(rulePath), "/")
	targetPath = filepath.ToSlash(targetPath)

	// 如果规则路径以 /* 结尾，表示匹配该目录下的所有文件（不包括子目录）
	if strings.HasSuffix(rulePath, "/*") {
		// 去掉 /* 后缀
		baseDir := strings.TrimSuffix(rulePath, "/*")
		// 检查目标路径是否以这个基础目录开头
		if strings.HasPrefix(targetPath, baseDir+"/") {
			// 检测匹配后的路径是否还有下级目录
			removeDuplicatePath := targetPath[len(baseDir)+1:]
			for _, v := range removeDuplicatePath {
				if v == '/' {
					return false
				}
			}
			// 没有下级目录，匹配成功
			return true
		}
		return false
	}

	// 如果规则路径以 /** 结尾，表示递归匹配该目录下的所有文件
	if strings.HasSuffix(rulePath, "/**") {
		baseDir := strings.TrimSuffix(rulePath, "/**")
		return strings.HasPrefix(targetPath, baseDir+"/") || targetPath == baseDir
	}

	// 如果规则路径不包含路径分隔符，则只匹配文件名（例如 *.cfg 匹配任何路径下的 .cfg 文件）
	if !strings.Contains(rulePath, "/") {
		targetFileName := filepath.Base(targetPath)
		matched, err := filepath.Match(rulePath, targetFileName)
		if err != nil {
			servicelog.Warnf("路径匹配错误: %v\n", err)
			return false
		}
		return matched
	}

	// 使用 filepath.Match 进行标准的 glob 匹配
	matched, err := filepath.Match(rulePath, targetPath)
	if err != nil {
		servicelog.Warnf("路径匹配错误: %v\n", err)
		return false
	}

	return matched
}

// =====================
// 规划阶段：构建树
// =====================

// buildTree: 扫描 srcRoot，构建以 "." 为根的目录树
// 仅建立关系列表与 isDir 标志，不执行匹配/决策。
// 为什么要构建树：
// - 便于做“目录级剪枝”（整棵子树统一动作时上提为父目录整体动作）
// - 便于做“父 -> 子”的继承传递（默认操作或目录规则）
// 复杂度：O(N) 其中 N 为文件+目录数；WalkDir 一次扫描。
func buildTree(srcRoot string) (*Node, error) {
	funcIdt := "-service.decompression.buildTree-"
	root := &Node{relPath: ".", isDir: true}
	pathToNode := map[string]*Node{".": root}

	err := filepath.WalkDir(srcRoot, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			// 记录并继续
			servicelog.Warnf("%s遍历文件时出错: %s, 错误: %v\n", funcIdt, p, err)
			return nil
		}
		// 获取对于srcRoot的相对路径
		rel, rErr := filepath.Rel(srcRoot, p)
		if rErr != nil {
			return rErr
		}
		rel = filepath.ToSlash(rel)
		if rel == "." {
			return nil
		}
		// 确保父链存在（逐级创建中间目录的 Node）
		ensureChain(pathToNode, rel)
		n := pathToNode[rel]
		n.isDir = d.IsDir()
		return nil
	})
	if err != nil {
		return nil, err
	}
	// 组装 children（根据路径层级，将每个节点挂到其父节点下）
	for rel, n := range pathToNode {
		if rel == "." {
			continue
		}
		parent := parentPath(rel)
		if parentNode, ok := pathToNode[parent]; ok {
			parentNode.children = append(parentNode.children, n)
		}
	}
	return root, nil
}

// 确保父链存在
func ensureChain(pathToNode map[string]*Node, rel string) {
	if _, ok := pathToNode[rel]; ok {
		return
	}
	parent := parentPath(rel)
	if parent != "." {
		ensureChain(pathToNode, parent)
	}
	pathToNode[rel] = &Node{relPath: rel}
}

func parentPath(rel string) string {
	dir := filepath.ToSlash(filepath.Dir(rel))
	if dir == "." || dir == "" {
		return "."
	}
	return dir
}

// =====================
// 规划阶段：应用决策（规则 > 继承 > 默认）
// =====================

// applyDecisions: 按“规则 > 继承 > 默认”的优先级，为每个节点确定最终动作
// - 同一节点命中多条规则：报错
// - 若未命中规则且有父决策：继承父决策（目录整体动作向下生效）
// - 否则：应用 defaultAction
// 示例：
//   - default=overwrite；rules=[a/b/1.txt:skip]
//     a 目录若无显式规则 -> a 采用 overwrite；
//     a/b/1.txt 命中规则 -> 采用 skip，不受父 a 影响；
//     a/b/2.txt 未命中规则 -> 继承 a 的 overwrite（若 a 也无，则用 default）。
func applyDecisions(node *Node, parent *ActionDecision, rules []Rule, defaultAct OverrideAction) error {
	funcIdt := "-service.decompression.applyDecisions-"

	// 规则匹配：返回命中的规则集合（设计为集合，为多命中报错提供依据）
	hits := matchRules(node.relPath, rules)
	if len(hits) > 1 {
		return fmt.Errorf("规则冲突: 节点 '%s' 命中多条规则", node.relPath)
	}

	if defaultAct == OverrideActionRename {
		return fmt.Errorf("%s发生错误:不允许使用 rename 作为默认规则 详见doc中的dft模版说明", funcIdt)
	}

	var ruleDec *ActionDecision
	if len(hits) == 1 {
		act, err := stringToOverrideAction(hits[0].Action)
		if err != nil {
			return err
		}
		ruleDec = &ActionDecision{action: act, target: hits[0].Target, source: "rule"}
		if act == OverrideActionRename {
			ruleDec.newName = hits[0].NewName
		}
	}

	// 继承：仅当未命中规则且父节点存在决策时生效 不继承rename选项
	var inheritDec *ActionDecision
	if ruleDec == nil && parent != nil && parent.action != OverrideActionRename {
		inheritedTarget := ""
		if parent.target != "" {
			inheritedTarget = filepath.ToSlash(filepath.Join(parent.target, filepath.Base(node.relPath)))
		}
		inheritDec = &ActionDecision{action: parent.action, target: inheritedTarget, source: "inherit"}
	}

	// 默认：既无规则也无继承时，兜底采用 defaultAction
	var defaultDec *ActionDecision
	if ruleDec == nil && inheritDec == nil {
		defaultDec = &ActionDecision{action: defaultAct, target: "", source: "default"}
	}

	// 按优先级选择最终决策（规则 > 继承 > 默认）
	final := pickDecision(ruleDec, inheritDec, defaultDec)
	if final != nil {
		node.hasDecision = true
		node.decidedAction = final.action
		node.decidedTarget = final.target
		node.decidedSource = final.source
		// 如果是 rename 操作，保存新文件名
		if final.action == OverrideActionRename {
			node.newName = final.newName
		}
	}

	// 如果不是叶节点 遍历
	if node.isDir {
		for _, ch := range node.children {
			if err := applyDecisions(ch, final, rules, defaultAct); err != nil {
				return err
			}
		}
	}
	return nil
}

type ActionDecision struct {
	action  OverrideAction
	target  string
	source  string // rule | inherit | default
	newName string
}

// matchRules: 使用路径匹配器对单个节点进行规则匹配
// 返回所有命中的规则；由上层决定“多命中即报错”
// 注意：DirectoryMatching 支持：
// - "/*" 同级所有文件（不含子目录）
// - "/**" 递归匹配
// - 无斜杠的通配符按“仅文件名”匹配（例如 *.cfg 匹配所有目录下的 .cfg 文件）
func matchRules(relPath string, rules []Rule) []Rule {
	rel := filepath.ToSlash(relPath)
	var hits []Rule
	for _, r := range rules {
		if DirectoryMatching(r.Pattern, rel) {
			hits = append(hits, r)
		}
	}
	return hits
}

// 按照 规格 > 继承 > 默认的规则 返回Action
func pickDecision(ruleDec, inheritDec, defaultDec *ActionDecision) *ActionDecision {
	if ruleDec != nil {
		return ruleDec
	}
	if inheritDec != nil {
		return inheritDec
	}
	return defaultDec
}

// =====================
// 规划阶段：重命名文件路径处理
// =====================
func RenamePathProcess(node *Node) {

}

// =====================
// 规划阶段：剪枝（上提统一动作）
// =====================

// pruneTree: 两阶段剪枝算法
// 阶段1：自底向上计算每个节点的 subtreeUniform（子树是否一致）和 uniformAction/target（统一的动作和目标）
// 阶段2：自顶向下，只在最高的一致节点处清空并生成目录任务，避免低层清空后高层无法判断一致性的问题
func pruneTree(node *Node) {
	// 使用 map 存储每个节点的计算信息（不修改 Node 结构体）
	uniformInfo := make(map[*Node]*UniformInfo)

	// 阶段1：自底向上计算每个节点的 subtreeUniform 和 uniformAction/target
	computeUniformInfo(node, uniformInfo)

	// 阶段2：自顶向下，在最高的一致节点处清空并生成目录任务
	applyPruning(node, uniformInfo, false)
}

// UniformInfo 存储节点的子树一致性信息（两阶段剪枝用）
type UniformInfo struct {
	subtreeUniform bool           // 子树是否完全一致
	uniformAction  OverrideAction // 统一的动作（仅在 subtreeUniform=true 时有效）
	uniformTarget  string         // 统一的目标（仅在 subtreeUniform=true 时有效）
	uniformSource  string         // 统一的来源（仅在 subtreeUniform=true 时有效）
}

// computeUniformInfo: 阶段1 - 自底向上计算每个节点的 subtreeUniform 和 uniformAction/target
func computeUniformInfo(node *Node, uniformInfo map[*Node]*UniformInfo) {
	if !node.isDir {
		// 叶节点（文件）：如果自身有决策，则子树一致；否则不一致
		info := &UniformInfo{}
		// 由于 rename 操作只针对单一文件所以不可能一致
		if node.hasDecision && node.decidedAction != OverrideActionRename {
			info.subtreeUniform = true
			info.uniformAction = node.decidedAction
			info.uniformTarget = node.decidedTarget
			info.uniformSource = node.decidedSource
		} else {
			info.subtreeUniform = false
		}
		uniformInfo[node] = info
		return
	}

	// 目录节点：先递归计算所有子节点
	for _, ch := range node.children {
		computeUniformInfo(ch, uniformInfo)
	}

	// 处理空目录的情况：没有子节点，如果自身有决策则一致，否则不一致
	if len(node.children) == 0 {
		info := &UniformInfo{}
		if node.hasDecision && node.decidedAction != OverrideActionRename {
			info.subtreeUniform = true
			info.uniformAction = node.decidedAction
			info.uniformTarget = node.decidedTarget
			info.uniformSource = node.decidedSource
		} else {
			info.subtreeUniform = false
		}
		uniformInfo[node] = info
		return
	}

	// 有子节点：检查所有子节点的一致性
	info := &UniformInfo{}
	var base *ActionDecision

	// 检查所有子节点的 uniformInfo
	for _, ch := range node.children {
		chInfo := uniformInfo[ch]
		if !chInfo.subtreeUniform {
			// 子节点不一致，父节点也不一致
			info.subtreeUniform = false
			uniformInfo[node] = info
			return
		}
		// 子节点一致，检查动作和目标是否相同
		chDec := &ActionDecision{
			action: chInfo.uniformAction,
			target: chInfo.uniformTarget,
			source: chInfo.uniformSource,
		}
		if base == nil {
			// 提取预期父节点的目标（由于 chInfo.uniformTarget 是子节点的完整目标，预期父节点目标应为去掉最后一段）
			parentTarget := ""
			if chDec.target != "" {
				parentTarget = filepath.ToSlash(filepath.Dir(chDec.target))
				if parentTarget == "." {
					parentTarget = ""
				}
			}
			base = &ActionDecision{action: chDec.action, target: parentTarget, source: chDec.source}
		}

		expectedChildTarget := ""
		if base.target != "" {
			expectedChildTarget = filepath.ToSlash(filepath.Join(base.target, filepath.Base(ch.relPath)))
		}

		// 如果 base.target 为空，说明是自然路径映射，子节点也必须是空目标
		if base.target == "" && chDec.target != "" {
			info.subtreeUniform = false
			uniformInfo[node] = info
			return
		}

		if base.action != chDec.action || (base.target != "" && expectedChildTarget != chDec.target) || chDec.action == OverrideActionRename {
			// 子节点动作或目标不一致或有 rename 操作，父节点不一致
			info.subtreeUniform = false
			uniformInfo[node] = info
			return
		}
	}

	// 所有子节点一致，父节点也一致（base 一定不为 nil，因为至少有子节点）
	// 但是！父节点自身的决策（如果有的话，哪怕是继承的）必须与子节点一致，否则不能合并
	if node.hasDecision && node.decidedAction != OverrideActionRename {
		if node.decidedAction != base.action || node.decidedTarget != base.target {
			info.subtreeUniform = false
			uniformInfo[node] = info
			return
		}
	}

	info.subtreeUniform = true
	info.uniformAction = base.action
	info.uniformTarget = base.target
	info.uniformSource = base.source
	uniformInfo[node] = info
}

// applyPruning: 阶段2 - 自顶向下，在最高的一致节点处清空并生成目录任务
// parentApplied: 父节点是否已经应用了剪枝（如果父节点已剪枝，子节点不应再剪枝）
func applyPruning(node *Node, uniformInfo map[*Node]*UniformInfo, parentApplied bool) {
	if !node.isDir {
		return
	}

	info := uniformInfo[node]
	if info == nil || !info.subtreeUniform {
		// 节点不一致，继续处理子节点
		for _, ch := range node.children {
			applyPruning(ch, uniformInfo, false)
		}
		return
	}

	// 节点一致，但父节点已剪枝，则子节点不应再剪枝
	if parentApplied {
		for _, ch := range node.children {
			applyPruning(ch, uniformInfo, true)
		}
		return
	}

	// 节点一致且父节点未剪枝：上提动作并清空子树
	if isWholeDirAction(info.uniformAction) {
		node.hasDecision = true
		node.decidedAction = info.uniformAction
		node.decidedTarget = info.uniformTarget
		node.decidedSource = info.uniformSource
		clearDescendantDecisions(node)
		// 子节点已被清空，无需再递归处理（它们已被父节点统一处理）
		return
	} else {
		// 虽然一致，但不是目录级动作，继续处理子节点
		for _, ch := range node.children {
			applyPruning(ch, uniformInfo, false)
		}
	}
}

// clearDescendantDecisions: 清空整棵子树的决策，表示"由父目录整体动作处理"。
// 目的：防止在执行计划中对子项重复下达任务；保持目录级任务的原子性与可读性。
func clearDescendantDecisions(node *Node) {
	var dfs func(n *Node)
	dfs = func(n *Node) {
		for _, ch := range n.children {
			ch.hasDecision = false
			ch.decidedAction = ""
			ch.decidedTarget = ""
			ch.decidedSource = ""
			ch.newName = ""
			dfs(ch)
		}
	}
	dfs(node)
}

// =====================
// 规划阶段：生成执行计划
// =====================

// generateExecutionPlan: 根据剪枝后的树，生成"目录级任务优先"的执行计划。
// -若当前节点是目录，且存在目录级整体动作：产生一个目录任务并停止下钻（子树已被父处理）。
// -若当前节点是文件，且存在决策：产生文件任务。
// -否则继续遍历子节点。
// 扩展建议：此处目前只做 dry-run 计划输出；接入真实 I/O 时，
// -overwrite: 构造 src=srcRoot+relPath, dst=dstRoot+Target 并复制（必要时创建目录、原子替换）
// -backup: 可先调用 o.Backup 再执行覆盖；或将备份也纳入 Task 类型
// -rename: 针对文件时对 dst 路径做重命名；目录级 rename 需谨慎设计
// 并发：可基于目录切片并发执行，但要控制并发度与错误聚合。
// srcDirName: 源目录名称，用于处理根节点（relPath = "."）的情况
func generateExecutionPlan(node *Node, dstRoot string, srcDirName string) []Task {
	var tasks []Task
	// 目录整体动作：作为一个目录级任务，下方已剪枝或无决策
	if node.isDir && node.hasDecision && isWholeDirAction(node.decidedAction) {
		// 仅当子树不存在任何决策（已被剪枝或本就无决策）时，才能安全上提为目录任务
		if !subtreeHasDecisions(node) {
			target := buildTarget(dstRoot, node.relPath, node.decidedTarget, srcDirName)
			tasks = append(tasks, Task{
				Path:   node.relPath,
				Action: node.decidedAction,
				Target: target,
				IsDir:  true,
			})
			return tasks
		}
		// 子树仍有决策，继续下钻以尊重更具体的子规则
	}
	if !node.isDir && node.hasDecision {
		task := Task{
			Path:   node.relPath,
			Action: node.decidedAction,
			Target: buildTarget(dstRoot, node.relPath, node.decidedTarget, srcDirName),
			IsDir:  false,
		}
		// 如果是 rename 操作，设置新文件名
		if node.decidedAction == OverrideActionRename {
			task.NewName = node.newName
		}
		tasks = append(tasks, task)
		return tasks
	}
	for _, ch := range node.children {
		tasks = append(tasks, generateExecutionPlan(ch, dstRoot, srcDirName)...)
	}
	return tasks
}

// buildTarget: 将"目标相对路径"拼接到 dstRoot，若未指定则沿用源相对路径
// 未来支持映射时：decidedTarget 由规则提供；未提供则按 relPath 对齐。
func buildTarget(dstRoot, relPath, decidedTarget, srcDirName string) string {
	if decidedTarget != "" {
		return filepath.Join(dstRoot, decidedTarget)
	}
	// 当 relPath = "." 时（根节点），直接返回 dstRoot（表示合并到目标目录本身）
	if relPath == "." {
		return dstRoot
	}
	return filepath.Join(dstRoot, relPath)
}

// isWholeDirAction: 判断动作是否可作为“目录级整体动作”
// 语义：若一个目录被判定为整体 overwrite/skip/backup/rename，则可对整个子树生效。
// 若你的业务希望“目录规则不一票否决更具体的子规则”，请仅在剪枝通过时使用目录级任务。
func isWholeDirAction(a OverrideAction) bool {
	switch a {
	case OverrideActionOverwrite, OverrideActionSkip, OverrideActionBackup, OverrideActionRename:
		return true
	default:
		return false
	}
}

// subtreeHasDecisions: 判断当前目录节点的子树（不含自身）中，是否仍存在任何决策。
// 用途：避免在目录本身有默认/继承决策时，过早生成目录级任务而吞掉子规则。
func subtreeHasDecisions(node *Node) bool {
	var found bool
	var dfs func(n *Node)
	dfs = func(n *Node) {
		if found {
			return
		}
		for _, ch := range n.children {
			if ch.hasDecision {
				found = true
				return
			}
			if ch.isDir {
				dfs(ch)
			}
		}
	}
	dfs(node)
	return found
}

// =====================
// 执行阶段：执行计划
// =====================

func ComplyTask(srcDirPath, modType string, tasks []Task) error {
	funcIdt := "-service.decompression.ComplyTask-"
	o := OverrideStruct{}
	runTaskConut := 0
	for _, task := range tasks {
		switch task.Action {
		case OverrideActionOverwrite:
			fullSrcDirPath := filepath.Join(srcDirPath, task.Path) // SrcDirPath在磁盘中的完整路径
			err := o.Overwrite(fullSrcDirPath, task.Target)
			if err != nil {
				return fmt.Errorf("%s执行Overwrite时发生错误 task:%v", funcIdt, task)
			}
		case OverrideActionSkip:
			continue
		case OverrideActionBackup:
			fullSrcDirPath := filepath.Join(srcDirPath, task.Path)
			err := o.Backup(modType, fullSrcDirPath)
			if err != nil {
				return fmt.Errorf("%s执行Backup时发生错误 task:%v", funcIdt, task)
			}
		case OverrideActionRename:
			fullSrcPath := filepath.Join(srcDirPath, task.Path)
			// 先复制文件到目标位置
			if err := o.Overwrite(fullSrcPath, task.Target); err != nil {
				return fmt.Errorf("%s执行Rename时复制文件失败 task:%v, err:%v", funcIdt, task, err)
			}
			// 然后重命名目标文件
			if task.NewName != "" {
				targetDir := filepath.Dir(task.Target)
				newTargetPath := filepath.Join(targetDir, task.NewName)
				err := o.Rename(task.Target, newTargetPath)
				if err != nil {
					return fmt.Errorf("%s执行Rename时重命名失败 task:%v, err:%v", funcIdt, task, err)
				}
			} else {
				return fmt.Errorf("%s执行Rename时缺少NewName字段 task:%v", funcIdt, task)
			}
		case OverrideActionAsk:
			continue // TODO:支持询问用户
		default:
			continue
		}
		runTaskConut++
	}
	return nil
}
