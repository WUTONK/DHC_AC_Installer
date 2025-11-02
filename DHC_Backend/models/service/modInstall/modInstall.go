package modinstall

import (
	"DHC_Backend/models/service/decompression"
	"fmt"
)

// 单模组安装
func SingleModInstall(srcPath string, filePassword string) {
	funcIdt := "-modinstall.SingleModInstall"
	// 逻辑：
	// 传入文件并解压（非压缩包直接复制）到中间目录
	unDecompressionPath, errorTiming, err := decompression.Decompression(srcPath, filePassword, decompression.Dir)
	if err != nil {
		fmt.Printf("%s在调用decompression.Decompression()时发生错误:%s,errorTiming:%s\n", funcIdt, err, errorTiming)
		return
	}
	fmt.Printf("%s解压完成，解压目录: %s\n", funcIdt, unDecompressionPath)
	// 检测覆盖规则

	// 进行安装
}

// 多模组安装
func m() {

}

// 导入模组包到本地
func local() {

}
