package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"DHC_Backend/models/service/types"
	"fmt"
)

// 单模组安装
func SingleModInstall(srcPath string, filePassword string, d types.DftPathGetModOrPath) {
	funcIdt := "-modinstall.SingleModInstall"
	// 逻辑：
	// 传入文件并解压（非压缩包直接复制）到中间目录
	unDecompressionPath, errorTiming, err := decompression.Decompression(srcPath, filePassword, types.DftPathFromDir)
	if err != nil {
		fmt.Printf("%s在调用decompression.Decompression()时发生错误:%s,errorTiming:%s\n", funcIdt, err, errorTiming)
		return
	}
	fmt.Printf("%s解压完成，解压目录: %s\n", funcIdt, unDecompressionPath)
	// 检测覆盖规则

	dftPath := decompression.GetDftPath(srcPath, unDecompressionPath, d)
	_ = dftPath // 暂时未使用，后续会用于覆盖控制
	// 偏移量的
	// config, err := decompression.DecodeDhcFileTagConfig(dftPath)

	// decompression.OverrideControl()

	// 进行安装
}

// 多模组安装
func m() {

}

// 导入模组包到本地
func local() {

}
