package main

import (
	"DHC_Backend/handler"
	"DHC_Backend/models/service/servicelog"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 重定向到文件时让 Gin 访问日志与 servicelog 一样及时落盘（tail -f 可见）。
	gin.DefaultWriter = servicelog.SyncingStdout()
	gin.DefaultErrorWriter = servicelog.SyncingStdout()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:11451", "http://127.0.0.1:11451"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.GET("/", func(c *gin.Context) {
		c.String(200, "DHC Server pong!")
	})

	handler.InitGin(router)

	log.Println("Backend Server is running on port http://127.0.0.1:19810")
	log.Println("Frontend login page is running on path http://localhost:11451")

	// 服务器运行端口
	router.Run("127.0.0.1:19810")
}
