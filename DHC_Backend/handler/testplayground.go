package handler

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// 开发者测试页：真实 HTTP 往返（与 TestPlayground 前端配套）

type playgroundJob struct {
	started time.Time
}

var (
	playgroundJobsMu sync.Mutex
	playgroundJobs   = map[string]playgroundJob{}
)

func registerTestPlaygroundRoutes(g gin.IRouter) {
	g.GET("/api/TestPlaygroundHealth", testPlaygroundHealth)
	g.POST("/api/TestPlaygroundEcho", testPlaygroundEcho)
	g.POST("/api/TestPlaygroundJob/start", testPlaygroundJobStart)
	g.GET("/api/TestPlaygroundJob/progress", testPlaygroundJobProgress)
}

func testPlaygroundHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"pong":       true,
		"serverTime": time.Now().Format(time.RFC3339Nano),
	})
}

func testPlaygroundEcho(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON body", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"echo":       payload,
		"serverTime": time.Now().Format(time.RFC3339Nano),
		"message":    "DHC_Backend received your request",
	})
}

func testPlaygroundJobStart(c *gin.Context) {
	id := fmt.Sprintf("%d", time.Now().UnixNano())
	playgroundJobsMu.Lock()
	playgroundJobs[id] = playgroundJob{started: time.Now()}
	playgroundJobsMu.Unlock()
	c.JSON(http.StatusOK, gin.H{
		"jobId":   id,
		"message": "poll GET /api/TestPlaygroundJob/progress?jobId=" + id,
	})
}

func testPlaygroundJobProgress(c *gin.Context) {
	jobID := c.Query("jobId")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing jobId"})
		return
	}
	playgroundJobsMu.Lock()
	j, ok := playgroundJobs[jobID]
	playgroundJobsMu.Unlock()
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "unknown jobId"})
		return
	}
	elapsed := time.Since(j.started)
	// 约 4 秒内从 0 到 100（用于演示轮询进度）
	p := int(elapsed.Seconds() * 28)
	if p > 100 {
		p = 100
	}
	phase := "processing"
	if p >= 100 {
		phase = "done"
	}
	c.JSON(http.StatusOK, gin.H{
		"jobId":    jobID,
		"progress": p,
		"phase":    phase,
		"detail": gin.H{
			"step":       "simulated_task",
			"elapsedSec": elapsed.Seconds(),
		},
	})
}
