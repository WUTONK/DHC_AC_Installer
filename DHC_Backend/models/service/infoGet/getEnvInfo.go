package infoGet

import (
	"os"
	"strings"
)

// ReadEnvBool 读取环境变量并解析为 bool 值。
// - 环境变量为空：返回 defaultVal
// - 环境变量为 "true"（忽略大小写）：返回 true
// - 其他值：返回 false
func ReadEnvBool(key string, defaultVal bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return defaultVal
	}
	return strings.EqualFold(v, "true")
}
