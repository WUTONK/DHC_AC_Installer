package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/types"
	"fmt"
	"path/filepath"
)

// 资源包将会分为：
// - 完整包(全部资源)
// - 最小包(仅主图+一个C1环线副图+SHMC车包)
// - 完整地图包|完整车辆包|完整光影包|完整仪表盘包

// 从资源包引入资源
// 参数：-资源包路径
func DhcResoucePkgImport(pkgPath string) error {
	funcIdt := "-modInstall.DhcResoucePkgImport-"

	// 解压到 DHC_Backend/resources/importResourceCache
	// 然后拿去覆盖 DHC_Backend/resources
	var dstFilePath string
	backendRootPath, err := infoGet.GetBackendRootPath()
	if err != nil {
		return fmt.Errorf("%s获取根目录路径时发生错误: %v", funcIdt, err)
	}

	isDevMode := infoGet.IsDevModeGet()
	if isDevMode {
		dstFilePath = filepath.Join(backendRootPath, "test", "simEnv", "resources", "importResourceCache")
	} else {
		dstFilePath = filepath.Join(backendRootPath, "resources", "importResourceCache")
		// TODO：补充非开发模式下获取 windows desktop 路径函数
	}

	options := decompression.DecompressionOptions{
		SrcPath:     pkgPath,
		DstFilePath: dstFilePath,
	}

	_, errorTiming, err := decompression.DecompressionWithOptions(options)
	if err != nil {
		return fmt.Errorf("%s解压失败:errorTiming:%s, err:%s", funcIdt, errorTiming, err)
	}

	fmt.Println("资源引入成功")
	return nil

}

// 单模组安装
func SingleModInstall(srcPath string, filePassword string, d types.DftPathGetModOrPath) {
	funcIdt := "-modinstall.SingleModInstall"
	// 逻辑：
	// 传入文件并解压（非压缩包直接复制）到中间目录
	opts := decompression.DecompressionOptions{
		SrcPath:             srcPath,
		FilePassword:        filePassword,
		IsMod:               true,
		DftPathGetModOrPath: d,
	}
	unDecompressionPath, errorTiming, err := decompression.DecompressionWithOptions(opts)
	if err != nil {
		fmt.Printf("%s在调用decompression.DecompressionWithOptions()时发生错误:%s,errorTiming:%s\n", funcIdt, err, errorTiming)
		return
	}
	fmt.Printf("%s解压完成，解压目录: %s\n", funcIdt, unDecompressionPath)
	// 检测覆盖规则

	dftPath := decompression.GetDftPath(srcPath, unDecompressionPath, d)
	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		fmt.Printf("%s获取游戏路径失败:%s\n", funcIdt, err)
		return
	}

	config, err := decompression.DecodeDhcFileTagConfig(dftPath)
	if err != nil {
		fmt.Printf("%s解码配置文件失败:%s\n", funcIdt, err)
		return
	}

	// 处理 OverwriteStartingDir 为空的情况（使用默认值）
	overwriteDir := config.OverwriteStartingDir
	overrideDstFile := filepath.Join(gamePath, overwriteDir)
	fmt.Printf("%s目标覆盖目录: %s\n", funcIdt, overrideDstFile)

	err = decompression.OverrideControl(unDecompressionPath, overrideDstFile, dftPath)
	if err != nil {
		fmt.Printf("%s执行OverrideControl时发生错误:%s\n", funcIdt, err)
		return
	}
	// 进行安装
}

// 多模组安装
func m() {

}

// 导入模组包到本地
func local() {

}
