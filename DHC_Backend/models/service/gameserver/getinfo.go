package gameserver

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"runtime"
	"strconv"
	"strings"
	"time"

	"golang.org/x/net/icmp"
	"golang.org/x/net/ipv4"
)

type serverList string

const (
	Baidu serverList = "www.baidu.com"
)

// PingResult 表示ping的结果
type PingResult struct {
	Target   string
	Delay    time.Duration
	Timeout  time.Duration
	TimedOut bool
	Error    error
}

// getPing 使用ICMP协议ping目标服务器
// targetServer: 目标服务器地址
// timeout: 超时时间
// 返回延迟时间，如果超时则返回超时错误
func GetPing(targetServer string, timeout time.Duration) (*PingResult, error) {
	result := &PingResult{
		Target:  targetServer,
		Timeout: timeout,
	}

	// 解析目标地址
	ips, err := net.LookupIP(targetServer)
	if err != nil {
		result.Error = fmt.Errorf("DNS解析失败: %v", err)
		return result, result.Error
	}

	if len(ips) == 0 {
		result.Error = errors.New("无法解析到IP地址")
		return result, result.Error
	}

	// 使用第一个IP地址
	ip := ips[0]

	// 根据操作系统选择合适的网络类型：
	// - 在 macOS/BSD 上使用非特权的 "udp4"，避免原始套接字权限问题
	// - 其他平台使用原始 ICMP "ip4:icmp"
	network := "ip4:icmp"
	if runtime.GOOS == "darwin" || runtime.GOOS == "freebsd" || runtime.GOOS == "openbsd" || runtime.GOOS == "netbsd" || runtime.GOOS == "dragonfly" {
		network = "udp4"
	}

	// 创建ICMP连接
	c, err := icmp.ListenPacket(network, "0.0.0.0")
	if err != nil {
		result.Error = fmt.Errorf("创建ICMP连接失败: %v", err)
		return result, result.Error
	}
	defer c.Close()

	// 构造ICMP Echo Request报文
	msg := icmp.Message{
		Type: ipv4.ICMPTypeEcho,
		Code: 0,
		Body: &icmp.Echo{
			ID:   12345,
			Seq:  1,
			Data: []byte("ping"),
		},
	}

	wb, err := msg.Marshal(nil)
	if err != nil {
		result.Error = fmt.Errorf("序列化ICMP消息失败: %v", err)
		return result, result.Error
	}

	// 记录开始时间
	start := time.Now()

	// 发送ICMP包
	var dstAddr net.Addr
	if network == "udp4" {
		dstAddr = &net.UDPAddr{IP: ip}
	} else {
		dstAddr = &net.IPAddr{IP: ip}
	}
	_, err = c.WriteTo(wb, dstAddr)
	if err != nil {
		result.Error = fmt.Errorf("发送ICMP包失败: %v", err)
		return result, result.Error
	}

	// 设置读取超时
	if err := c.SetDeadline(start.Add(timeout)); err != nil {
		result.Error = fmt.Errorf("设置超时失败: %v", err)
		return result, result.Error
	}

	// 接收响应
	rb := make([]byte, 1500)
	n, peer, err := c.ReadFrom(rb)
	if err != nil {
		// 检查是否是超时
		if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
			result.TimedOut = true
			result.Error = fmt.Errorf("ping超时 (%v)", timeout)
			return result, result.Error
		}
		result.Error = fmt.Errorf("读取响应失败: %v", err)
		return result, result.Error
	}

	// 解析响应（IPv4 使用协议号 1）
	rm, err := icmp.ParseMessage(ipv4.ICMPTypeEchoReply.Protocol(), rb[:n])
	if err != nil {
		result.Error = fmt.Errorf("解析响应失败: %v", err)
		return result, result.Error
	}

	// 检查响应类型
	if rm.Type != ipv4.ICMPTypeEchoReply {
		result.Error = fmt.Errorf("收到非预期的ICMP类型: %v", rm.Type)
		return result, result.Error
	}

	// 验证peer地址（在 UDP 封装下忽略端口，仅比较IP）
	var peerIP net.IP
	switch a := peer.(type) {
	case *net.IPAddr:
		peerIP = a.IP
	case *net.UDPAddr:
		peerIP = a.IP
	default:
		peerIP = net.ParseIP(peer.String())
	}
	if !peerIP.Equal(ip) {
		result.Error = fmt.Errorf("收到来自非预期地址的响应: %v (期望: %v)", peer, ip)
		return result, result.Error
	}

	// 计算延迟
	result.Delay = time.Since(start)

	return result, nil
}

// GetServerPingDelay 获取服务器ping延迟的便捷方法
// server: 服务器枚举
// timeout: 超时时间，例如 3*time.Second
// 返回延迟时间（毫秒）和错误
func GetServerPingDelay(server serverList, timeout time.Duration) (int64, error) {
	result, err := GetPing(string(server), timeout)
	if err != nil {
		return 0, err
	}

	// 返回延迟（毫秒）
	return result.Delay.Milliseconds(), nil
}

// ---获取 AC server 部分---
type SessionInfo struct {
	Clients    int64 `json:"clients"`
	MaxClients int64 `json:"maxclients"`
}

// GetServerInfo 接收一个 AC server 地址, 示例: 1.1.1.1:8081
// 然后返回一个 SessionInfo struct
func GetServerInfo(serverHost string) (SessionInfo, error) {

	serverHostSlice := strings.Split(serverHost, ":")

	host := serverHostSlice[0]
	httpPort, _ := strconv.Atoi(serverHostSlice[1])

	url := fmt.Sprintf("http://%s:%d/INFO", host, httpPort)

	start := time.Now()
	resp, err := http.Get(url)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	rtt := time.Since(start)

	var info SessionInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		panic(err)
	}

	fmt.Printf("Players: %d/%d\n", info.Clients, info.MaxClients)
	fmt.Printf("Approx RTT (HTTP): %v\n", rtt)

	return info, nil
}
