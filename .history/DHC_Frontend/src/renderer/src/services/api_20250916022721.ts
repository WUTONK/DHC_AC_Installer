import axios, { AxiosResponse } from 'axios'

// API 基础配置
const API_BASE_URL = 'http://localhost:8080'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 请求错误:', error)
    return Promise.reject(error)
  }
)

// 类型定义
export interface User {
  id: number
  name: string
  email: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

// API 服务类
export class ApiService {
  // 健康检查
  static async healthCheck(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await apiClient.get('/health')
    return response.data
  }

  // 获取用户列表
  static async getUsers(): Promise<ApiResponse<User[]>> {
    const response: AxiosResponse<ApiResponse<User[]>> = await apiClient.get('/api/v1/users')
    return response.data
  }

  // 创建用户
  static async createUser(userData: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.post('/api/v1/users', userData)
    return response.data
  }

  // 获取单个用户
  static async getUser(id: number): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.get(`/api/v1/users/${id}`)
    return response.data
  }

  // 更新用户
  static async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await apiClient.put(`/api/v1/users/${id}`, userData)
    return response.data
  }

  // 删除用户
  static async deleteUser(id: number): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await apiClient.delete(`/api/v1/users/${id}`)
    return response.data
  }
}

export default apiClient
