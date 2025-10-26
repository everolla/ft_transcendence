// Client only manages access token
let accessToken = localStorage.getItem('accessToken')

async function makeAuthenticatedRequest(url, options = {}) {
  const makeRequest = (token) => fetch(url, {
    ...options,
    credentials: 'include', // Include cookies (refresh token)
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  })
  
  try {
    let response = await makeRequest(accessToken)
    
    if (response.status === 403 || response.status === 401) {
      // Try to refresh token
      const refreshResponse = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Send refresh token cookie
      })
      
      if (refreshResponse.ok) {
        const { accessToken: newToken } = await refreshResponse.json()
        localStorage.setItem('accessToken', newToken)
        accessToken = newToken
        
        // Retry with new access token
        response = await makeRequest(accessToken)
      } else {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return
      }
    }
    
    return response
  } catch (error) {
    console.error('Request failed:', error)
    throw error
  }
}

// Login function
async function login(email, password) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    credentials: 'include', // Include cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (response.ok) {
    const { accessToken } = await response.json()
    localStorage.setItem('accessToken', accessToken)
    // Refresh token is automatically stored as HTTP-only cookie
  }
}