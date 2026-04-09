// Package servicelog 提供基于 github.com/charmbracelet/log 的分级彩色日志。
//
// 该库提供了成熟的彩色标签和层级控制。
// 级别从低到高：Debug < Info < Warn < Error。全局阈值设为 L 时，仅输出级别 >= L 的日志。
//
// 环境变量 DHC_LOG_LEVEL 可覆盖默认阈值，取值：debug | info | warn | error。
package servicelog

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/charmbracelet/log"
	"github.com/muesli/termenv"
)

// syncWriter 在每次 Write 后对底层文件 Sync，便于 start_all.sh 里
// `go run ... > logs/backend.log` 时 tail -f 能立即看到 servicelog 输出
// （否则非 TTY 的 stdout 常被全缓冲，长时间看不到新行）。
type syncWriter struct {
	out *os.File
}

func (w syncWriter) Write(p []byte) (int, error) {
	n, err := w.out.Write(p)
	if err != nil {
		return n, err
	}
	// 管道/部分控制台不支持 Sync，忽略错误；普通文件重定向下可正常落盘。
	_ = w.out.Sync()
	return n, nil
}

var _ io.Writer = syncWriter{}

// SyncingStdout 返回写入 os.Stdout 且每次 Write 后 Sync 的 Writer；
// 用于 Gin 等库在重定向到文件时仍能 tail -f 立刻看到访问日志。
func SyncingStdout() io.Writer {
	return syncWriter{out: os.Stdout}
}

// Level 日志级别别名，方便调用方使用。
type Level = log.Level

const (
	LevelDebug = log.DebugLevel
	LevelInfo  = log.InfoLevel
	LevelWarn  = log.WarnLevel
	LevelError = log.ErrorLevel
)

func init() {
	// 这个库在测试中如果直接被劫持，可能依然会落回无色模式，
	// 因此需要显式地配置一个带颜色的 Logger（覆写默认 logger 的各种格式器设置）
	logger := log.NewWithOptions(syncWriter{out: os.Stdout}, log.Options{
		ReportTimestamp: false,
		Level:           log.InfoLevel,
	})

	// 在底层直接操作输出器的颜色环境
	logger.SetColorProfile(termenv.ANSI256)

	log.SetDefault(logger)

	// 根据环境变量解析等级
	if v := strings.TrimSpace(os.Getenv("DHC_LOG_LEVEL")); v != "" {
		SetLevel(ParseLevel(v))
	}
}

// ParseLevel 解析环境变量等使用的字符串；无法识别时返回 InfoLevel。
func ParseLevel(s string) Level {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "debug", "d", "dbg":
		return log.DebugLevel
	case "info", "i":
		return log.InfoLevel
	case "warn", "warning", "w":
		return log.WarnLevel
	case "error", "e", "err":
		return log.ErrorLevel
	default:
		return log.InfoLevel
	}
}

// SetLevel 设置全局最低输出级别。
func SetLevel(l Level) {
	log.SetLevel(l)
}

// GetLevel 返回当前全局阈值。
func GetLevel() Level {
	return log.GetLevel()
}

// Debugf 中间过程、解压细节、冗长 trace。
func Debugf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Debug(strings.TrimSuffix(msg, "\n"))
}

// Infof 一般运行信息。
func Infof(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Info(strings.TrimSuffix(msg, "\n"))
}

// Warnf 告警。
func Warnf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Warn(strings.TrimSuffix(msg, "\n"))
}

// Errorf 错误与失败路径。
func Errorf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	log.Error(strings.TrimSuffix(msg, "\n"))
}
