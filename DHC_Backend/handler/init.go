package handler

import (
	"github.com/gin-gonic/gin"
)

// InitGin 初始化 Gin 路由，注册所有 API 端点。
// 各 handler 文件通过 registerXxxRoute(g) 自行注册路由，init.go 只负责调度。
func InitGin(g gin.IRouter) {
	initTasksFromDisk()
	registerInfoHandlerRoute(g)
	registerServerInfoHandlerRoute(g)
	registerAppStateHandlerRoute(g)
	registerTestPlaygroundRoutes(g)
	registerCommunicationLabRoutes(g)
	registerInstallationRoutes(g)
	registerDemoPrecheckRoutes(g)
	registerSystemInfoHandlerRoute(g)
}
