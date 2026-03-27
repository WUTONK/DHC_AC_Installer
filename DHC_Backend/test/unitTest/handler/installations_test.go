package handler_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"DHC_Backend/handler"

	"github.com/gin-gonic/gin"
)

func TestInstallationFlowMinimal(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var gloP interface{}
	// 使用真实路由注册，做“黑盒”链路测试：
	// 测试只通过 HTTP 访问接口，不直接调用内部私有函数，
	// 能更接近前端/调用方实际使用方式。
	r := gin.New()
	handler.InitGin(r)

	// Step 1: 创建安装任务，并拿到 installId。
	// 这是后续所有轮询请求的唯一定位键。
	reqBody := []byte(`{"versionId":"standard"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/installations", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("create installation status=%d body=%s", w.Code, w.Body.String())
	}

	var createResp struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &createResp); err != nil {
		t.Fatalf("unmarshal create resp failed: %v, body=%s", err, w.Body.String())
	}
	if createResp.ID == "" {
		t.Fatalf("expected install id, got empty body=%s", w.Body.String())
	}

	// Step 2: 轮询 CM 进度，直到任务完成或超时。
	// 这里给 7 秒超时窗口，覆盖模拟任务的完整阶段。
	deadline := time.Now().Add(7 * time.Second)
	completed := false

	for time.Now().Before(deadline) {
		pollReq := httptest.NewRequest(
			http.MethodGet,
			"/api/installations/"+createResp.ID+"/progress?category=cm",
			nil,
		)
		pollW := httptest.NewRecorder()
		r.ServeHTTP(pollW, pollReq)
		if pollW.Code != http.StatusOK {
			t.Fatalf("poll progress status=%d body=%s", pollW.Code, pollW.Body.String())
		}

		var progressResp struct {
			InstallID     string  `json:"installId"`
			Status        string  `json:"status"`
			TotalProgress float64 `json:"totalProgress"`
			Categories    []struct {
				CategoryID string  `json:"categoryId"`
				Status     string  `json:"status"`
				Progress   float64 `json:"progress"`
			} `json:"categories"`
		}
		if err := json.Unmarshal(pollW.Body.Bytes(), &progressResp); err != nil {
			t.Fatalf("unmarshal progress resp failed: %v body=%s", err, pollW.Body.String())
		}

		if progressResp.InstallID != createResp.ID {
			t.Fatalf("installId mismatch: want=%s got=%s", createResp.ID, progressResp.InstallID)
		}
		// category=cm 时应只返回一条 cm 类别进度，
		// 用于验证“按类别过滤”逻辑生效。
		if len(progressResp.Categories) != 1 || progressResp.Categories[0].CategoryID != "cm" {
			t.Fatalf("expected single cm category, got=%s", pollW.Body.String())
		}

		if progressResp.Status == "completed" {
			// 完成态下总体进度和 CM 进度都应达到 100，
			// 这能确保任务最终状态和数值状态一致。
			if progressResp.TotalProgress < 100 {
				t.Fatalf("expected totalProgress 100 at completion, got %.2f body=%s", progressResp.TotalProgress, pollW.Body.String())
			}
			if progressResp.Categories[0].Progress < 100 {
				t.Fatalf("expected cm progress 100 at completion, got %.2f body=%s", progressResp.Categories[0].Progress, pollW.Body.String())
			}
			completed = true
			gloP = &progressResp
			break
		}

		time.Sleep(200 * time.Millisecond)

		// 本次轮询测试成功 输出最终 json body
		json.Unmarshal(pollW.Body.Bytes(), &progressResp)
		fmt.Println(&progressResp)
	}

	if !completed {
		// 这里失败通常表示后台任务没推进，或轮询窗口太短。
		t.Fatalf("installation did not complete within timeout")
	}

	fmt.Println(gloP)
}
