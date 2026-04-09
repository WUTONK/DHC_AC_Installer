package handler

import (
	apiModels "DHC_Backend/apiModels"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// InitGin 初始化 Gin 路由，注册所有 API 端点。
func InitGin(g gin.IRouter) {
	g.GET("/api/GetGamePath", getGamePath)
	g.GET("/api/GetServerInfo", GetServerInfo)
	registerAppStateHandlerRoute(g)
	registerTestPlaygroundRoutes(g)
	registerCommunicationLabRoutes(g)
	registerInstallationRoutes(g)
	registerDemoPrecheckRoutes(g)
	registerSystemInfoHandlerRoute(g)
}

// getGamePath 占位 handler，后续对接 infoGet.GetGamePath()
func getGamePath(c *gin.Context) {
	gamefile := "testFile"

	fmt.Println("use getGamePath function")
	c.JSON(http.StatusOK, apiModels.GetGamePathResp{
		GamePath: gamefile,
	})
}

// getImportedResourceIntegrityInfo 获取引入资源完整性信息（待实现）
func getImportedResourceIntegrityInfo() {

}
