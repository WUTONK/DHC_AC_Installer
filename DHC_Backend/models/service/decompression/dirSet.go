package decompression

import (
	"DHC_Backend/models/service/infoGet"
	"os"
	"path/filepath"
	"runtime"
)

// TODO:实现以下逻辑 检测用户哪个盘剩余空间最多 并且在游戏所在盘符剩余空间较少时 自动选择盘符作为资源库文件夹和缓存文件夹
// 资源文件夹推荐所需空间（最大包体积+1GB计算）
// 缓存文件夹推荐所需空间（最大包解压体积+1GB计算）
// 资源文件夹最小所需空间（最小包体积+1GB计算）
// 缓存文件夹最小所需空间（最小包解压体积+1GB计算）

// 自动配置资源文件夹和缓存文件夹
// 返回值 推荐资源库文件夹盘符 推荐缓存文件夹盘符 是否推荐更换游戏目录
func AutoSetResouceDirLocal() (string, string, bool, error) {
	// 在 windows 以外的系统上模拟返回盘符
	isDev := infoGet.IsDevModeGet()

	// 检测游戏本体所在盘符空间
	gamePath, err := infoGet.GetGamePathAuto()
	if err != nil {
		return "", "", false, err
	}
	var gamePathDrive string
	if isDev {
		gamePathDrive = "C:"
	} else {
		gamePathDrive = filepath.VolumeName(gamePath)
	}

	// 检测系统有哪些盘符
	var dirList []string
	if runtime.GOOS != "windows" || isDev {
		// 非 Windows 系统或开发模式：返回模拟盘符
		dirList = []string{"C:", "D:", "E:"}
	} else {
		// 遍历 A-Z 盘符，检查是否存在
		for drive := 'A'; drive <= 'Z'; drive++ {
			drivePath := string(drive) + ":\\"
			// 检查盘符是否存在
			if _, err := os.Stat(drivePath); err == nil {
				dirList = append(dirList, string(drive)+":")
			}
		}
	}

	// 检测其他盘符空间
	var dirListWithoutGameDrive []string
	for _, v := range dirList {
		if v != gamePathDrive {
			dirListWithoutGameDrive = append(dirListWithoutGameDrive, v)
		}
	}

	// 按照mb计算
	var dirListWithoutGameDriveSpace map[string]int
	for _, v := range dirListWithoutGameDrive {
		space, err := infoGet.GetDiskUsage(v)
		if err != nil {
			// TODO：编写错误处理
		}
		dirListWithoutGameDriveSpace[v] = space
	}

	// 是否推荐更换游戏目录检测逻辑
	// 逻辑：如果剩余空间不足 最大包解压体积+5gb 则推荐更换
	// 从文件中读取

	// 读取资源文件夹所需空间（安装最大包体积+1GB计算）
	// 读取资源文件夹所需空间（安装最大包解压体积+1GB计算）

	// 检测是否有盘符同时塞得下这两个 最大包体积+最大包解压体积+2GB

	// 如果没有就查看哪个盘符可以塞得下 资源文件夹有限 缓存文件夹其次 按照A-Z排序

	// 剔除塞不下的盘符

	// 磁盘空间不足处理（返回是哪个塞不下 资源 or 缓存 or 全部）

	// 计算更换后的空间 来判断是否要迁移源库文件夹位置 or 缓存文件夹 到原游戏盘符
	// 逻辑

}
