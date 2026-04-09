package handler

import (
	apiModels "DHC_Backend/apiModels"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// registerInfoHandlerRoute 注册信息查询相关路由（游戏路径、资源完整性等）。
func registerInfoHandlerRoute(g gin.IRouter) {
	g.GET("/api/GetGamePath", getGamePath)
}

// getGamePath 占位 handler，后续对接 infoGet.GetGamePath()
// TODO: 对接 infoGet.GetGamePath()，返回真实游戏路径
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
