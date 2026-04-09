package handler

import (
	apiModels "DHC_Backend/apiModels"
	"DHC_Backend/models/service/gameserver"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// registerServerInfoHandlerRoute 注册服务器信息查询相关路由。
func registerServerInfoHandlerRoute(g gin.IRouter) {
	g.GET("/api/GetServerInfo", GetServerInfo)
}

// GetServerInfo 处理 /api/GetServerInfo 请求，查询指定服务器的在线状态。
// 支持 JSON body 或 query 参数传入 ServerHost。
func GetServerInfo(c *gin.Context) {
	var req apiModels.GetServerInfoReq

	if err := c.ShouldBindJSON(&req); err != nil {
		if err == io.EOF {
			// GET 通常没有 body，尝试从 query 读取
			q := c.Query("ServerHost")
			if q == "" {
				q = c.Query("serverHost")
			}
			if q == "" {
				log.Printf("GetServerInfo missing ServerHost in body and query")
				c.JSON(http.StatusBadRequest, gin.H{"error": "missing ServerHost"})
				return
			}
			req.ServerHost = q
		} else {
			log.Printf("GetServerInfo bind error: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err})
			return
		}
	}

	info, err := gameserver.GetServerInfo(req.ServerHost)
	if err != nil {
		log.Printf("GetServerInfo service error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}

	data, _ := json.MarshalIndent(info, "", "  ")
	fmt.Printf("%s\n", data)

	c.JSON(http.StatusOK, apiModels.GetServerInfoResp{
		Rtt:        info.Rtt,
		Clients:    float32(info.Clients),
		MaxClients: float32(info.MaxClients),
	})
}
