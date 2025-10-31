package handler

import (
	apiModels "DHC_Backend/apiModels"
	"DHC_Backend/models/service/gameserver"
	"encoding/json"

	// "crypto/rand"
	// "encoding/base64"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func InitGin(g gin.IRouter) {
	g.GET("/api/GetGamePath", getGamePath)
	g.GET("/api/GetServerInfo")
}

func GetServerInfo(c *gin.Context) {
	var req apiModels.GetServerInfoReq

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}

	info, err := gameserver.GetServerInfo(req.ServerHost)
	if err != nil {
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
