package handler

import (
	"github.com/gin-gonic/gin"
)

func registerSystemInfoHandlerRoute(g gin.IRouter) {
	g.GET("/api/GetDiskInfo", getDiskInfoHandler)
}

func getDiskInfoHandler(c *gin.Context) {

}
