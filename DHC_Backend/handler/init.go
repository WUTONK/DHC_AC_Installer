package handler

import (
	apiModels "DHC_Backend/apiModels"
	"DHC_Backend/models/service/gameserver"
	"encoding/json"
	"io"

	// "crypto/rand"
	// "encoding/base64"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func InitGin(g gin.IRouter) {
	g.GET("/api/GetGamePath", getGamePath)
	g.GET("/api/GetServerInfo", GetServerInfo)
	registerAppStateHandlerRoute(g)
	registerTestPlaygroundRoutes(g)
	registerCommunicationLabRoutes(g)
	registerInstallationRoutes(g)
}

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

func getGamePath(c *gin.Context) {
	gamefile := "testFile"

	fmt.Println("use getGamePath function")
	c.JSON(http.StatusOK, apiModels.GetGamePathResp{
		GamePath: gamefile,
	})
}

// 获取引入资源完整性信息
func getImportedResourceIntegrityInfo() {

}
