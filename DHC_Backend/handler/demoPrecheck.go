package handler

import (
	modinstall "DHC_Backend/models/service/modInstall"
	"net/http"

	"github.com/gin-gonic/gin"
)

// registerDemoPrecheckRoutes 注册 DEMO 前置检测相关接口。
func registerDemoPrecheckRoutes(g gin.IRouter) {
	g.GET("/api/demo/precheck/resources", demoPrecheckResourcesHandler)
	g.GET("/api/demo/precheck/dlc-carpack", demoPrecheckDlcCarPackHandler)
	g.GET("/api/demo/precheck/cm", demoPrecheckCmHandler)
}

// demoPrecheckResourcesHandler 返回 DEMO 资源包完整性信息（用于 PreCheckPage 的“资源包就绪状态”卡片）。
func demoPrecheckResourcesHandler(c *gin.Context) {
	imported, complete, err := modinstall.DetectDemoResourcesIntegrityWithTracker(modinstall.NewTaskTracker(nil))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"imported": imported,
		"complete": complete,
	})
}

// demoPrecheckDlcCarPackHandler 返回 DEMO 的 DLC/车包齐全性（用于 PreCheckPage 的 “DLC 与车包检测” 卡片）。
func demoPrecheckDlcCarPackHandler(c *gin.Context) {
	hasAll := modinstall.DetectDemoDlcAndCarPack()
	c.JSON(http.StatusOK, gin.H{
		"hasAllDLC": hasAll,
	})
}

// demoPrecheckCmHandler 返回本地 CM 是否已安装（用于 PreCheckPage 的 “Content Manager (CM) 检测” 卡片）。
func demoPrecheckCmHandler(c *gin.Context) {
	isCmExist, _, err := modinstall.DetectLocalCmPath()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"cmInstalled": isCmExist,
	})
}

