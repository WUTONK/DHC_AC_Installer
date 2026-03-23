package handler

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type labTask struct {
	startedAt time.Time
}

var (
	labTaskMu sync.Mutex
	labTasks  = map[string]labTask{}
)

func registerCommunicationLabRoutes(g gin.IRouter) {
	g.GET("/api/lab/ping", labPing)
	g.POST("/api/lab/echo", labEcho)
	g.POST("/api/lab/task/start", labStartTask)
	g.GET("/api/lab/task/status", labTaskStatus)
}

func labPing(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"time":   time.Now().Format(time.RFC3339Nano),
		"lesson": "step1",
	})
}

func labEcho(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"ok":     false,
			"error":  "invalid json",
			"detail": err.Error(),
		})
		return
	}

	// for _,v := range body{
	// 	// 打印每个请求字段，方便你在后端日志里看到前端传来的内容。
	// 	log.Print(v)
	// }

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"echo":    body,
		"time":    time.Now().Format(time.RFC3339Nano),
		"subInfo": "Test subInfo",
	})
}

func labStartTask(c *gin.Context) {
	taskID := fmt.Sprintf("lab-%d", time.Now().UnixNano())
	labTaskMu.Lock()
	labTasks[taskID] = labTask{startedAt: time.Now()}
	labTaskMu.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"taskId": taskID,
	})
}

func labTaskStatus(c *gin.Context) {
	taskID := c.Query("taskId")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"ok":    false,
			"error": "missing taskId",
		})
		return
	}

	labTaskMu.Lock()
	task, exists := labTasks[taskID]
	labTaskMu.Unlock()
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"ok":    false,
			"error": "task not found",
		})
		return
	}

	elapsed := time.Since(task.startedAt)
	progress := int(elapsed.Milliseconds() / 80)
	if progress > 100 {
		progress = 100
	}

	status := "running"
	if progress >= 100 {
		status = "done"
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"taskId":   taskID,
		"status":   status,
		"progress": progress,
	})
}
