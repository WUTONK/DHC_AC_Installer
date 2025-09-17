package main

import (
	"log"
	// "DHC_Backend/handle"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:11451"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.GET("/", func(c *gin.Context) {
		c.String(200, "DHC Server pong!")
	})

	// handler.InitGin(router)

	log.Println("Backend Server is running on port http://127.0.0.1:19810")
	log.Println("Frontend login page is running on path http://localhost:11451")

	// 服务器运行端口
	router.Run("127.0.0.1:19810")
}
