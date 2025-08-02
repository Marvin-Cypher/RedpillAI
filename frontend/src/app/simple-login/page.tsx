'use client'

import { useState } from 'react'

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('user@redpill.vc')
  const [password, setPassword] = useState('password123')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Login attempt: ${email}`)
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      if (response.ok) {
        const data = await response.json()
        // Store the token
        localStorage.setItem('access_token', data.access_token)
        alert('Login successful!')
        window.location.href = '/dashboard'
      } else {
        const errorData = await response.json()
        alert('Login failed: ' + (errorData.detail || 'Unknown error'))
      }
    } catch (error) {
      alert('Login error: ' + error)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>RedPill VC Login</h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '5px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '5px'
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}