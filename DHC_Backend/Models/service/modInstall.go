package service

// 实现解压缩和安装功能
// >)功能注释：旨在提供类似手动安装操作体验的操作接口（ winrar 式的解压互动逻辑，windows finder 式的覆盖互动逻辑）
// >)解压相关 - 支持.zip / .7z / .rar等压缩格式，解压后放在 rootpath/resources/(标记类型)/(文件名) 目录下，例如 rootpath/resources/mod/shutokoMap
// >)覆盖相关 - 支持覆盖/跳过同名目录或取消操作、覆盖警告模式（不警告、警告）被覆盖目录备份和还原，记录重点事件 (覆盖信息、安装时间戳)
