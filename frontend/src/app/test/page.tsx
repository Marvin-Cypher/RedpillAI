'use client'

export default function TestPage() {
  return (
    <div style={{ padding: '50px', background: 'white', color: 'black' }}>
      <h1>Test Page</h1>
      <p>If you can see this, React is working.</p>
      <button onClick={() => alert('Button works!')}>Click me</button>
    </div>
  )
}