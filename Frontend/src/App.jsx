import { useEffect, useMemo, useState } from 'react'
import { api } from './api/client'
import { useAuth } from './state/AuthContext'

const defaultTask = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  dueDate: ''
}

function prettyDate(date) {
  if (!date) return 'No due date'
  return new Date(date).toLocaleDateString()
}

function toDateInputValue(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

function Hero() {
  return (
    <section className="hero-card">
      <p className="kicker">Smart workflow command center</p>
      <h1>Task Orbit</h1>
      <p>
        A kinetic task management interface with role-based controls, quick execution, and
        focused clarity.
      </p>
      <div className="hero-tags">
        <span>OTP Signup</span>
        <span>Task Search + Filters</span>
        <span>Admin Analytics</span>
      </div>
    </section>
  )
}

function AuthPanel() {
  const { login } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [pendingVerification, setPendingVerification] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setStatus({ type: 'error', message: 'Password and confirm password do not match' })
          return
        }

        await api.register({
          username,
          email,
          password,
          confirmPassword,
          adminCode: adminCode.trim() || undefined,
          role: adminCode.trim() === 'Shashank45' ? 'admin' : 'user'
        })
        setPendingVerification(true)
        setStatus({
          type: 'success',
          message: 'Registration successful. Check your email for the OTP and verify your account.'
        })
        return
      }

      const data = await api.login({ email, username: username.trim() || undefined, password })
      login(data.user, data.token)
      setStatus({ type: 'success', message: 'Logged in successfully' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function handleVerifyOtp() {
    setStatus({ type: '', message: '' })
    try {
      const data = await api.verifyEmail({ email, otp })
      setPendingVerification(false)
      setStatus({ type: 'success', message: data.message })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function handleResendOtp() {
    setStatus({ type: '', message: '' })
    try {
      const data = await api.resendOtp({ email })
      setStatus({ type: 'success', message: data.message })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <section className="panel auth-panel">
      <div className="panel-header">
        <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <div className="toggle-row">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setPendingVerification(false)
            }}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register')
              setPendingVerification(false)
            }}
            type="button"
          >
            Register
          </button>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required={mode === 'register'} />
          </label>
        )}

        {mode === 'login' && (
          <>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Username (optional)
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
          </>
        )}

        {mode === 'register' && (
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={mode === 'register'} />
          </label>
        )}

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {mode === 'register' && (
          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={mode === 'register'}
            />
          </label>
        )}

        {mode === 'register' && (
          <label>
            Admin Secret Code
            <input
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Optional, required only for admin registration"
            />
          </label>
        )}

        <button className="primary" type="submit">
          {mode === 'login' ? 'Log In' : 'Register'}
        </button>
      </form>

      {pendingVerification && (
        <div className="otp-wrap">
          <label>
            OTP
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" />
          </label>
          <div className="task-actions">
            <button className="secondary" onClick={handleVerifyOtp} type="button">
              Verify Email
            </button>
            <button className="ghost" onClick={handleResendOtp} type="button">
              Resend OTP
            </button>
          </div>
        </div>
      )}

      {status.message && <p className={status.type === 'error' ? 'msg error' : 'msg success'}>{status.message}</p>}
    </section>
  )
}

function TaskBoard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(defaultTask)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [filter, setFilter] = useState({ search: '', status: '', priority: '' })
  const [message, setMessage] = useState('')

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'completed').length
    const pending = total - done
    const high = tasks.filter((t) => t.priority === 'high').length
    return { total, done, pending, high }
  }, [tasks])

  async function fetchTasks(params) {
    setLoading(true)
    try {
      const data = params ? await api.searchAndFilterTasks(params) : await api.getTasks()
      setTasks(data.task || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function handleCreateTask(event) {
    event.preventDefault()
    try {
      if (editingTaskId) {
        await api.updateTask(editingTaskId, form)
        setMessage('Task updated successfully')
      } else {
        await api.createTask(form)
        setMessage('Task created successfully')
      }

      setForm(defaultTask)
      setEditingTaskId(null)
      fetchTasks()
    } catch (error) {
      setMessage(error.message)
    }
  }

  function handleEditTask(task) {
    setEditingTaskId(task._id)
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      dueDate: toDateInputValue(task.dueDate)
    })
    setMessage('Editing task')
  }

  function handleCancelEdit() {
    setEditingTaskId(null)
    setForm(defaultTask)
    setMessage('')
  }

  async function handleDelete(id) {
    try {
      await api.deleteTask(id)
      setMessage('Task deleted')
      fetchTasks(filter)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleToggleStatus(task) {
    try {
      await api.markTaskComplete(task._id)
      fetchTasks(filter)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleLogout() {
    const shouldLogout = window.confirm('Are you sure you want to logout?')

    if (!shouldLogout) {
      return
    }

    try {
      await api.logout()
    } finally {
      logout()
    }
  }

  function applyFilter(event) {
    event.preventDefault()
    fetchTasks(filter)
  }

  return (
    <section className="dashboard-wrap">
      <header className="dash-header">
        <div>
          <p className="kicker">User mode</p>
          <h2>{user?.username || user?.email}</h2>
        </div>
        <button className="secondary" onClick={handleLogout} type="button">
          Logout
        </button>
      </header>

      <div className="stat-grid">
        <article>
          <h3>Total</h3>
          <p>{stats.total}</p>
        </article>
        <article>
          <h3>Pending</h3>
          <p>{stats.pending}</p>
        </article>
        <article>
          <h3>Completed</h3>
          <p>{stats.done}</p>
        </article>
        <article>
          <h3>High Priority</h3>
          <p>{stats.high}</p>
        </article>
      </div>

      <div className="grid-two">
        <section className="panel">
          <h3>{editingTaskId ? 'Edit Task' : 'Create Task'}</h3>
          <form className="form-grid" onSubmit={handleCreateTask}>
            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Due Date
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </label>
            <button className="primary" type="submit">
              {editingTaskId ? 'Save Changes' : 'Add Task'}
            </button>
            {editingTaskId && (
              <button className="ghost" type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </form>
        </section>

        <section className="panel">
          <h3>Search and Filter</h3>
          <form className="filter-row" onSubmit={applyFilter}>
            <input
              placeholder="Search title or description"
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
            />
            <select
              value={filter.status}
              onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filter.priority}
              onChange={(e) => setFilter((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className="secondary" type="submit">
              Apply
            </button>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                const next = { search: '', status: '', priority: '' }
                setFilter(next)
                fetchTasks(next)
              }}
            >
              Reset
            </button>
          </form>

          <div className="task-list">
            {loading && <p>Loading tasks...</p>}
            {!loading && tasks.length === 0 && <p>No tasks found.</p>}
            {tasks.map((task) => (
              <article key={task._id} className="task-card">
                <div>
                  <h4>{task.title}</h4>
                  <p>{task.description || 'No description'}</p>
                </div>
                <div className="task-meta">
                  <span className={`chip ${task.status}`}>{task.status}</span>
                  <span className={`chip ${task.priority}`}>{task.priority}</span>
                  <small>{prettyDate(task.dueDate)}</small>
                </div>
                <div className="task-actions">
                  <button className="secondary" type="button" onClick={() => handleEditTask(task)}>
                    Edit
                  </button>
                  {task.status !== 'completed' ? (
                    <button className="secondary" type="button" onClick={() => handleToggleStatus(task)}>
                      Mark Complete
                    </button>
                  ) : (
                    <button className="secondary" type="button" disabled>
                      Completed
                    </button>
                  )}
                  <button className="danger" type="button" onClick={() => handleDelete(task._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {message && <p className="msg success">{message}</p>}
    </section>
  )
}

function AdminBoard() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedUserTasks, setSelectedUserTasks] = useState([])
  const [message, setMessage] = useState('')

  async function loadAdminData() {
    try {
      const [usersData, dashboardData] = await Promise.all([
        api.adminGetAllUsers(),
        api.adminGetDashboardData()
      ])
      setUsers(usersData.users || [])
      setStats(dashboardData)
    } catch (error) {
      setMessage(error.message)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  async function inspectUserTasks(id) {
    try {
      const data = await api.adminGetUserTasks(id)
      setSelectedUserTasks(data.task || [])
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function deleteUser(id) {
    try {
      await api.adminDeleteUser(id)
      setMessage('User deleted successfully')
      loadAdminData()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleLogout() {
    const shouldLogout = window.confirm('Are you sure you want to logout?')

    if (!shouldLogout) {
      return
    }

    try {
      await api.logout()
    } finally {
      logout()
    }
  }

  return (
    <section className="dashboard-wrap">
      <header className="dash-header">
        <div>
          <p className="kicker">Admin mode</p>
          <h2>{user?.username || user?.email}</h2>
        </div>
        <button className="secondary" onClick={handleLogout} type="button">
          Logout
        </button>
      </header>

      {stats && (
        <div className="stat-grid">
          <article>
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </article>
          <article>
            <h3>Total Tasks</h3>
            <p>{stats.totalTasks}</p>
          </article>
          <article>
            <h3>Pending</h3>
            <p>{stats.pendingTasks}</p>
          </article>
          <article>
            <h3>Completed</h3>
            <p>{stats.completedTasks}</p>
          </article>
        </div>
      )}

      <div className="grid-two">
        <section className="panel">
          <h3>Users</h3>
          <div className="task-list">
            {users.map((u) => (
              <article className="task-card" key={u._id}>
                <div>
                  <h4>{u.username}</h4>
                  <p>{u.email}</p>
                  <small>
                    Completed tasks: {u.completedTasks || 0} / {u.totalTasks || 0}
                  </small>
                </div>
                <div className="task-actions">
                  <button className="secondary" onClick={() => inspectUserTasks(u._id)} type="button">
                    View Tasks
                  </button>
                  <button className="danger" onClick={() => deleteUser(u._id)} type="button">
                    Delete User
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Selected User Tasks</h3>
          <div className="task-list">
            {selectedUserTasks.length === 0 && <p>Select a user to inspect tasks.</p>}
            {selectedUserTasks.map((task) => (
              <article className="task-card" key={task._id}>
                <div>
                  <h4>{task.title}</h4>
                  <p>{task.description || 'No description'}</p>
                </div>
                <div className="task-meta">
                  <span className={`chip ${task.status}`}>{task.status}</span>
                  <span className={`chip ${task.priority}`}>{task.priority}</span>
                  {task.completedAt && <small>Completed on {prettyDate(task.completedAt)}</small>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {message && <p className="msg success">{message}</p>}
    </section>
  )
}

export default function App() {
  const { user } = useAuth()

  return (
    <main className="app-shell">
      <div className="bg-layer one" />
      <div className="bg-layer two" />
      {!user && (
        <div className="landing-layout">
          <Hero />
          <AuthPanel />
        </div>
      )}

      {user?.role === 'user' && <TaskBoard />}
      {user?.role === 'admin' && <AdminBoard />}
    </main>
  )
}