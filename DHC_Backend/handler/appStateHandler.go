package handler

import (
	"DHC_Backend/models/service/infoGet"
	"net/http"

	"github.com/gin-gonic/gin"
)

type upsertServerDisclaimerReq struct {
	ShownCount             int  `json:"shownCount"`
	DevForceShowSuppressed bool `json:"devForceShowSuppressed"`
}

// registerAppStateHandlerRoute 统一注册 appState.json 相关接口。
func registerAppStateHandlerRoute(g gin.IRouter) {
	g.GET("/api/AppState", getAppStateHandler)
	g.PUT("/api/AppState/ServerDisclaimer", upsertServerDisclaimerHandler)
}

func getAppStateHandler(c *gin.Context) {
	state, err := infoGet.GetAppState()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, state)
}

func upsertServerDisclaimerHandler(c *gin.Context) {
	var req upsertServerDisclaimerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.ShownCount < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "shownCount must be >= 0"})
		return
	}

	err := infoGet.UpsertServerDisclaimerState(infoGet.ServerDisclaimerState{
		ShownCount:             req.ShownCount,
		DevForceShowSuppressed: req.DevForceShowSuppressed,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
		"serverDisclaimer": gin.H{
			"shownCount":             req.ShownCount,
			"devForceShowSuppressed": req.DevForceShowSuppressed,
		},
	})
}
