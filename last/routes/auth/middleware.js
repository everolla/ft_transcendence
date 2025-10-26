export const authenticateToken = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return reply.code(401).send({ error: 'Access token required' })
    }

    // Verify the token
    const decoded = request.server.jwt.verify(token)
    
    // Add user info to request object
    request.user = decoded
    
  } catch (error) {
    return reply.code(403).send({ error: 'Invalid or expired token' })
  }
}