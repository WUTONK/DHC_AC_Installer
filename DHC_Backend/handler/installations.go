package handler

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type installStatus string

const (
	installStatusPreparing installStatus = "preparing"
	installStatusInstalling installStatus = "installing"
	installStatusCompleted  installStatus = "completed"
	installStatusFailed     installStatus = "failed"
)

type categoryProgress struct {
	CategoryID     string  `json:"categoryId"`
	CategoryName   string  `json:"categoryName"`
	Status         string  `json:"status"`
	Progress       float64 `json:"progress"`
	CurrentItem    string  `json:"currentItem,omitempty"`
	TotalItems     int     `json:"totalItems,omitempty"`
	CompletedItems int     `json:"completedItems,omitempty"`
}

type installTask struct {
	ID         string
	VersionID  string
	Status     installStatus
	StartTime  int64
	EndTime    *int64
	Error      string
	Categories map[string]*categoryProgress
}

var (
	installTasksMu sync.RWMutex
	installTasks   = map[string]*installTask{}
)

func registerInstallationRoutes(g gin.IRouter) {
	g.POST("/api/installations", createInstallation)
	g.GET("/api/installations/:installId/progress", getInstallationProgress)
}

func createInstallation(c *gin.Context) {
	var req struct {
		VersionID string `json:"versionId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	installID := fmt.Sprintf("install_%d", time.Now().UnixNano())
	now := time.Now().Unix()
	task := &installTask{
		ID:        installID,
		VersionID: req.VersionID,
		Status:    installStatusPreparing,
		StartTime: now,
		Categories: map[string]*categoryProgress{
			"cm": {
				CategoryID:   "cm",
				CategoryName: "Content Manager",
				Status:       "waiting",
				Progress:     0,
				TotalItems:   3,
			},
		},
	}

	installTasksMu.Lock()
	installTasks[installID] = task
	installTasksMu.Unlock()

	go runSimulatedCMInstall(installID)

	c.JSON(http.StatusOK, gin.H{
		"id":        installID,
		"versionId": req.VersionID,
		"status":    task.Status,
		"startTime": task.StartTime,
	})
}

func getInstallationProgress(c *gin.Context) {
	installID := c.Param("installId")
	category := c.DefaultQuery("category", "all")

	installTasksMu.RLock()
	task, exists := installTasks[installID]
	if !exists {
		installTasksMu.RUnlock()
		c.JSON(http.StatusNotFound, gin.H{"error": "install task not found"})
		return
	}

	categories := make([]categoryProgress, 0)
	if category == "all" {
		for _, cp := range task.Categories {
			categories = append(categories, *cp)
		}
	} else if cp, ok := task.Categories[category]; ok {
		categories = append(categories, *cp)
	}

	totalProgress := calcTotalProgress(categories)
	resp := gin.H{
		"installId":     task.ID,
		"status":        task.Status,
		"totalProgress": totalProgress,
		"categories":    categories,
		"startTime":     task.StartTime,
		"endTime":       task.EndTime,
		"error":         nilIfEmpty(task.Error),
	}
	installTasksMu.RUnlock()

	c.JSON(http.StatusOK, resp)
}

func runSimulatedCMInstall(installID string) {
	steps := []struct {
		progress float64
		item     string
		done     int
	}{
		{15, "下载 CM 安装包", 0},
		{55, "解压 CM 文件", 1},
		{90, "写入配置并收尾", 2},
		{100, "安装完成", 3},
	}

	for i, step := range steps {
		time.Sleep(900 * time.Millisecond)
		installTasksMu.Lock()
		task, ok := installTasks[installID]
		if !ok {
			installTasksMu.Unlock()
			return
		}
		cp := task.Categories["cm"]
		cp.Status = "active"
		cp.Progress = step.progress
		cp.CurrentItem = step.item
		cp.CompletedItems = step.done
		task.Status = installStatusInstalling

		if i == len(steps)-1 {
			cp.Status = "completed"
			task.Status = installStatusCompleted
			now := time.Now().Unix()
			task.EndTime = &now
		}
		installTasksMu.Unlock()
	}
}

func calcTotalProgress(categories []categoryProgress) float64 {
	if len(categories) == 0 {
		return 0
	}
	var sum float64
	for _, cp := range categories {
		sum += cp.Progress
	}
	return sum / float64(len(categories))
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
