'use client'

import { useState } from 'react'

export default function DirectLoginPage() {
  const [email, setEmail] = useState('user@redpill.vc')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('Logging in...')
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Store the token
        localStorage.setItem('access_token', data.access_token)
        setMessage(`✅ Login successful! Token stored.`)
        
        // Redirect after 1 second
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        const error = await response.text()
        setMessage(`❌ Login failed: ${error}`)
      }
    } catch (error) {
      setMessage(`❌ Network error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #555;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          font-size: 16px;
          box-sizing: border-box;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          width: 100%;
          padding: 14px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover {
          background: #5a67d8;
        }
        button:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }
        .message {
          margin-top: 20px;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
        }
      `}</style>
      
      <div className="container">
        <h1>🔐 RedPill VC Login</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? '🔄 Logging in...' : '🚀 Sign In'}
          </button>
        </form>
        
        {message && (
          <div className="message">
            {message}
          </div>
        )}
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          Demo credentials: user@redpill.vc / password123
        </div>
      </div>
    </>
  )
}