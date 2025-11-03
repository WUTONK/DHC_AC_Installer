package decompression

import (
	"DHC_Backend/models/service/infoGet"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// dtf配置结构体
type DhcFileTagConfig struct {
	ModType       string        `json:"ModType"`
	DefaultAction DefaultAction `json:"defaultAction"`
	Rules         []Rule        `json:"rules"`
}

// DefaultAction 默认操作结构体
type DefaultAction struct {
	Action string `json:"action"`
	Backup bool   `json:"backup"`
}

// Rule 规则结构体
type Rule struct {
	Pattern string `json:"pattern"`
	Action  string `json:"action"`
	Backup  bool   `json:"backup"`
}

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
	hasDecision   bool
	decidedAction OverrideAction
	decidedTarget string
	decidedSource string // rule | inherit | default
}

// Task 计划项（此阶段仅输出计划，不实际执行 I/O）
type Task struct {
	// Path: 源相对路径（与 Node.relPath 一致）
	// Action: 计划执行的动作
	// Target: 目标相对路径（若为空则等于 Path；最终落地路径为 dstRoot + Target）
	// IsDir: 是否为目录级任务（目录级任务生成后会剪枝，避免对子项重复执行）
	Path   string
	Action OverrideAction
	Target string
	IsDir  bool
}

// 接受*一个*文件并覆盖目标文件 如果目标文件不存在 它会被创建
func (o OverrideStruct) Overwrite(srcFilePath, dstFilePath string) error {
	funcIdt := "-service.decompression.Overwrite-"

	srcFile, err := os.Open(srcFilePath)
	if err != nil {
		return fmt.Errorf("%s无法打开srcfile: %v", funcIdt, err)
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dstFilePath)
	if err != nil {
		return fmt.Errorf("%s无法创建dstfile: %v", funcIdt, err)
	}
	defer dstFile.Close()

	bytesWritten, err := io.Copy(dstFile, srcFile)
	if err != nil {
		return fmt.Errorf("%s无法复制并覆盖srcFile:%s 到 dstFile:%s ,err:%v", funcIdt, srcFilePath, dstFilePath, err)
	}

	fmt.Printf("%s成功复制 %d 字节从 %s 到 %s\n", funcIdt, bytesWritten, srcFilePath, dstFilePath)
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

// 接收一个文件路径并提取出文件名 然后将传入的路径的文件改为此文件名
func (o OverrideStruct) Rename(srcFilePath, dstFilePath string) error {
	funcIdt := "-service.decompression.Rename-"
	// 获取dst去文件名路径
	dstDir := filepath.Dir(dstFilePath)
	// 读取src文件名
	srcFilename := filepath.Base(srcFilePath)
	// 合成new dstname
	newDstnamePath := dstDir + "/" + srcFilename
	// 标准化路径（统一使用 / 作为分隔符）
	err := os.Rename(dstFilePath, newDstnamePath)
	if err != nil {
		return fmt.Errorf("%s重命名操作失败 错误信息: %v", funcIdt, err)
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
	config, err := decodeDhcFileTagConfig(dftJsonPath)
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
	fmt.Printf("%s正在获取游戏路径...\n", funcIdt)
	_, err = infoGet.GetGamePathAuto()
	if err != nil {
		return fmt.Errorf("%s获取游戏路径失败: %v", funcIdt, err)
	}
	fmt.Printf("%s游戏路径获取成功\n", funcIdt)

	// 打印调试信息
	fmt.Printf("模组类型: %s\n", modType)
	fmt.Printf("默认操作: %s, 备份: %t\n", defaultAction.Action, defaultAction.Backup)
	if !rulesUndefined {
		fmt.Printf("规则数量: %d\n", len(rules))
		for i, rule := range rules {
			fmt.Printf("规则 %d: 模式=%s, 操作=%s, 备份=%t\n", i+1, rule.Pattern, rule.Action, rule.Backup)
		}
	}

	// 辨别是否存在任何需备份文件（包含默认和指定路径操作）如果是那么创建备份文件夹
	if defaultAction.Backup || func() bool {
		for _, rule := range rules {
			if rule.Backup {
				fmt.Printf("规则模式 '%s' 需要备份\n", rule.Pattern)
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
	tasks := generateExecutionPlan(root, dstDirPath)

	// 打印计划摘要
	fmt.Printf("%s规划完成：共生成 %d 个任务\n", funcIdt, len(tasks))
	for _, t := range tasks {
		fmt.Printf("%s计划: [%s] %s -> %s (dir=%t)\n", funcIdt, t.Action, t.Path, t.Target, t.IsDir)
	}

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
	rulePath = filepath.ToSlash(rulePath)
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
			fmt.Printf("路径匹配错误: %v\n", err)
			return false
		}
		return matched
	}

	// 使用 filepath.Match 进行标准的 glob 匹配
	matched, err := filepath.Match(rulePath, targetPath)
	if err != nil {
		fmt.Printf("路径匹配错误: %v\n", err)
		return false
	}

	return matched
}

// decodeOverrideControlConfig 解码覆盖控制配置文件
func decodeDhcFileTagConfig(dftJsonPath string) (*DhcFileTagConfig, error) {
	// 检查文件是否存在
	if _, err := os.Stat(dftJsonPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("配置文件不存在: %s", dftJsonPath)
	}

	// 读取文件内容
	fileData, err := os.ReadFile(dftJsonPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %v", err)
	}

	// 解码 JSON
	var config DhcFileTagConfig
	if err := json.Unmarshal(fileData, &config); err != nil {
		return nil, fmt.Errorf("解析 JSON 配置失败: %v", err)
	}

	return &config, nil
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
			fmt.Printf("%s遍历文件时出错: %s, 错误: %v\n", funcIdt, p, err)
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
	// 规则匹配：返回命中的规则集合（设计为集合，为多命中报错提供依据）
	hits := matchRules(node.relPath, rules)
	if len(hits) > 1 {
		return fmt.Errorf("规则冲突: 节点 '%s' 命中多条规则", node.relPath)
	}

	var ruleDec *ActionDecision
	if len(hits) == 1 {
		act, err := stringToOverrideAction(hits[0].Action)
		if err != nil {
			return err
		}
		ruleDec = &ActionDecision{action: act, target: "", source: "rule"}
	}

	// 继承：仅当未命中规则且父节点存在决策时生效
	var inheritDec *ActionDecision
	if ruleDec == nil && parent != nil {
		inheritDec = &ActionDecision{action: parent.action, target: parent.target, source: "inherit"}
	}

	// 默认：既无规则也无继承时，兜底采用 defaultAction
	var defaultDec *ActionDecision
	if ruleDec == nil && inheritDec == nil {
		defaultDec = &ActionDecision{action: defaultAct, target: "", source: "default"}
	}

	// 获取规则
	final := pickDecision(ruleDec, inheritDec, defaultDec)
	if final != nil {
		node.hasDecision = true
		node.decidedAction = final.action
		node.decidedTarget = final.target
		node.decidedSource = final.source
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
	action OverrideAction
	target string
	source string // rule | inherit | default
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
// 规划阶段：剪枝（上提统一动作）
// =====================

// pruneTree: 若某目录的整棵子树“动作+目标”完全一致，则将动作上提到目录本身，
// 并清空子树的决策（标记为由父处理）。这样执行阶段即可只产生目录级任务，避免重复。
// 一致性的定义：子树所有后代节点均已“有决策”，且 (action, target) 完全一致。
// 为什么包含 target：未来支持“映射到特定目录”时，动作相同但目标不同不可上提。
// 边界：如果子树包含尚未决策的节点，则视为不一致，避免错误上提。
func pruneTree(node *Node) {
	if !node.isDir {
		return
	}
	for _, ch := range node.children {
		pruneTree(ch)
	}
	if allDescendantsSame(node) {
		// 将子树动作上提到父目录（本节点需要有决策）
		any := getAnyDescendantDecision(node)
		if any != nil {
			node.hasDecision = true
			node.decidedAction = any.action
			node.decidedTarget = any.target
			node.decidedSource = any.source
			clearDescendantDecisions(node)
		}
	}
}

// allDescendantsSame: 判断“整棵子树”的决策是否完全一致（比较 action 与 target）
// 注意：若子树中存在尚未决策的节点，则视为“不一致”。
// 复杂度：O(size_of_subtree)
func allDescendantsSame(node *Node) bool {
	var base *ActionDecision
	same := true
	var walk func(n *Node)
	walk = func(n *Node) {
		if !same {
			return
		}
		if n == node {
			for _, ch := range n.children {
				walk(ch)
			}
			return
		}
		if !n.hasDecision {
			same = false
			return
		}
		d := &ActionDecision{action: n.decidedAction, target: n.decidedTarget, source: n.decidedSource}
		if base == nil {
			base = d
		} else if base.action != d.action || base.target != d.target {
			same = false
			return
		}
		if n.isDir {
			for _, ch := range n.children {
				walk(ch)
			}
		}
	}
	walk(node)
	return same && base != nil
}

// getAnyDescendantDecision: 从子树中取任意一个后代节点的决策（用于上提时的“代表决策”）。
// 合法性：在 allDescendantsSame 已判定一致的前提下，任取其一等价。
func getAnyDescendantDecision(node *Node) *ActionDecision {
	var res *ActionDecision
	var dfs func(n *Node)
	dfs = func(n *Node) {
		if res != nil {
			return
		}
		if n != node && n.hasDecision {
			res = &ActionDecision{action: n.decidedAction, target: n.decidedTarget, source: n.decidedSource}
			return
		}
		for _, ch := range n.children {
			dfs(ch)
		}
	}
	dfs(node)
	return res
}

// clearDescendantDecisions: 清空整棵子树的决策，表示“由父目录整体动作处理”。
// 目的：防止在执行计划中对子项重复下达任务；保持目录级任务的原子性与可读性。
func clearDescendantDecisions(node *Node) {
	var dfs func(n *Node)
	dfs = func(n *Node) {
		for _, ch := range n.children {
			ch.hasDecision = false
			ch.decidedAction = ""
			ch.decidedTarget = ""
			ch.decidedSource = ""
			dfs(ch)
		}
	}
	dfs(node)
}

// =====================
// 规划阶段：生成执行计划
// =====================

// generateExecutionPlan: 根据剪枝后的树，生成“目录级任务优先”的执行计划。
// -若当前节点是目录，且存在目录级整体动作：产生一个目录任务并停止下钻（子树已被父处理）。
// -若当前节点是文件，且存在决策：产生文件任务。
// -否则继续遍历子节点。
// 扩展建议：此处目前只做 dry-run 计划输出；接入真实 I/O 时，
// -overwrite: 构造 src=srcRoot+relPath, dst=dstRoot+Target 并复制（必要时创建目录、原子替换）
// -backup: 可先调用 o.Backup 再执行覆盖；或将备份也纳入 Task 类型
// -rename: 针对文件时对 dst 路径做重命名；目录级 rename 需谨慎设计
// 并发：可基于目录切片并发执行，但要控制并发度与错误聚合。
func generateExecutionPlan(node *Node, dstRoot string) []Task {
	var tasks []Task
	// 目录整体动作：作为一个目录级任务，下方已剪枝或无决策
	if node.isDir && node.hasDecision && isWholeDirAction(node.decidedAction) {
		tasks = append(tasks, Task{
			Path:   node.relPath,
			Action: node.decidedAction,
			Target: buildTarget(dstRoot, node.relPath, node.decidedTarget),
			IsDir:  true,
		})
		return tasks
	}
	if !node.isDir && node.hasDecision {
		tasks = append(tasks, Task{
			Path:   node.relPath,
			Action: node.decidedAction,
			Target: buildTarget(dstRoot, node.relPath, node.decidedTarget),
			IsDir:  false,
		})
		return tasks
	}
	for _, ch := range node.children {
		tasks = append(tasks, generateExecutionPlan(ch, dstRoot)...)
	}
	return tasks
}

// buildTarget: 将“目标相对路径”拼接到 dstRoot，若未指定则沿用源相对路径
// 未来支持映射时：decidedTarget 由规则提供；未提供则按 relPath 对齐。
func buildTarget(dstRoot, relPath, decidedTarget string) string {
	if decidedTarget != "" {
		return filepath.Join(dstRoot, decidedTarget)
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
