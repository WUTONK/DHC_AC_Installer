import React, { useState, useEffect } from 'react'
import { ApiService, User } from '../services/api'

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ name: '', email: '' })
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ApiService.getUsers()
      if (response.success) {
        setUsers(response.data || [])
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('获取用户列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 创建用户
  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      setError('请填写完整信息')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await ApiService.createUser(newUser)
      if (response.success) {
        setNewUser({ name: '', email: '' })
        fetchUsers() // 重新获取用户列表
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('创建用户失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 更新用户
  const updateUser = async () => {
    if (!editingUser) return

    setLoading(true)
    setError(null)
    try {
      const response = await ApiService.updateUser(editingUser.id, editingUser)
      if (response.success) {
        setEditingUser(null)
        fetchUsers() // 重新获取用户列表
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('更新用户失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 删除用户
  const deleteUser = async (id: number) => {
    if (!confirm('确定要删除这个用户吗？')) return

    setLoading(true)
    setError(null)
    try {
      const response = await ApiService.deleteUser(id)
      if (response.success) {
        fetchUsers() // 重新获取用户列表
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('删除用户失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取用户列表
  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>用户管理系统</h1>
      
      {/* 错误提示 */}
      {error && (
        <div style={{ 
          backgroundColor: '#fee', 
          color: '#c33', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {/* 创建用户表单 */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>创建新用户</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="姓名"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="email"
            placeholder="邮箱"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <button
            onClick={createUser}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '创建中...' : '创建'}
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>用户列表</h3>
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {loading && users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {editingUser?.id === user.id ? (
                  <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                    <button
                      onClick={updateUser}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{user.name}</strong> - {user.email}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setEditingUser(user)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement
