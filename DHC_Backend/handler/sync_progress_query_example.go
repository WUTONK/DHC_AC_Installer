package handler

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type Task struct {
	ID       string `json:"id"`
	Status   string `json:"status"`
	Progress int    `json:"progress"`
}

var (
	mu    sync.RWMutex
	tasks = map[string]*Task{}
)

// 例子
func main() {
	r := gin.Default()

	// 1) 创建任务：马上返回，然后后台异步更新进度
	r.POST("/start", func(c *gin.Context) {
		id := fmt.Sprintf("task_%d", time.Now().UnixNano())

		mu.Lock()
		tasks[id] = &Task{ID: id, Status: "running", Progress: 0}
		mu.Unlock()

		// 异步 goroutine：模拟耗时任务
		go func(taskID string) {
			for p := 10; p <= 100; p += 10 {
				time.Sleep(300 * time.Millisecond)

				mu.Lock()
				t, ok := tasks[taskID]
				if !ok {
					mu.Unlock()
					return
				}
				t.Progress = p
				if p == 100 {
					t.Status = "done"
				}
				mu.Unlock()
			}
		}(id)

		c.JSON(http.StatusOK, gin.H{"id": id})
	})

	// 2) 查询任务：读锁
	r.GET("/progress/:id", func(c *gin.Context) {
		id := c.Param("id")

		mu.RLock()
		t, ok := tasks[id]
		if !ok {
			mu.RUnlock()
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		// 做一份快照，避免解锁后还在用共享指针
		snapshot := *t
		mu.RUnlock()

		c.JSON(http.StatusOK, snapshot)
	})

	r.Run(":8080")
}
