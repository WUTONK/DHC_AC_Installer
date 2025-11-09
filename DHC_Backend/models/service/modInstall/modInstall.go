package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/infoGet"
	"DHC_Backend/models/service/types"
	"fmt"
	"path/filepath"
)

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
