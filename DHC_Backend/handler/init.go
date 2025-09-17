package handler

import (
	"DHC_Backend/models"
	// "crypto/rand"
	// "encoding/base64"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func InitGin(g gin.IRouter) {
	g.GET("/api/GetGamePath", getGamePath)
}

func getGamePath(c *gin.Context) {
	gamefile := "testFile"

	fmt.Println("use getGamePath function")
	c.JSON(http.StatusOK, models.GamePathGet{
		GamePath: gamefile,
	})
}
