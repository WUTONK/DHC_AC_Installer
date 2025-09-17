package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// 示例数据结构
type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func main() {
	// 创建 Gin 路由器
	r := gin.Default()

	// 配置 CORS，允许前端访问
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:*", "http://127.0.0.1:*"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// 健康检查端点
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, Response{
			Success: true,
			Message: "后端服务运行正常",
		})
	})

	// API 路由组
	api := r.Group("/api/v1")
	{
		// 获取用户列表
		api.GET("/users", getUsers)

		// 创建用户
		api.POST("/users", createUser)

		// 获取单个用户
		api.GET("/users/:id", getUser)

		// 更新用户
		api.PUT("/users/:id", updateUser)

		// 删除用户
		api.DELETE("/users/:id", deleteUser)
	}

	// 启动服务器
	log.Println("Go 后端服务启动在端口 8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("服务器启动失败:", err)
	}
}

// 获取用户列表
func getUsers(c *gin.Context) {
	users := []User{
		{ID: 1, Name: "张三", Email: "zhangsan@example.com"},
		{ID: 2, Name: "李四", Email: "lisi@example.com"},
		{ID: 3, Name: "王五", Email: "wangwu@example.com"},
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "获取用户列表成功",
		Data:    users,
	})
}

// 创建用户
func createUser(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "请求数据格式错误: " + err.Error(),
		})
		return
	}

	// 模拟创建用户（实际项目中应该保存到数据库）
	user.ID = 4 // 模拟生成新ID

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "用户创建成功",
		Data:    user,
	})
}

// 获取单个用户
func getUser(c *gin.Context) {
	id := c.Param("id")

	// 模拟从数据库获取用户（实际项目中应该根据 id 查询）
	user := User{
		ID:    1,
		Name:  "张三",
		Email: "zhangsan@example.com",
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "获取用户成功，ID: " + id,
		Data:    user,
	})
}

// 更新用户
func updateUser(c *gin.Context) {
	id := c.Param("id")
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Message: "请求数据格式错误: " + err.Error(),
		})
		return
	}

	// 模拟更新用户（实际项目中应该根据 id 更新）
	user.ID = 1 // 保持原ID

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "用户更新成功，ID: " + id,
		Data:    user,
	})
}

// 删除用户
func deleteUser(c *gin.Context) {
	id := c.Param("id")

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "用户删除成功，ID: " + id,
	})
}
