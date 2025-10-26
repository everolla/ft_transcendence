'use strict'

export default async function (fastify) {
  fastify.post('/logout', { prehandler: fastify.authenticateToken }, async function (request, reply) {
    try {
      const { refreshToken } = request.cookies

      if (refreshToken) {
      // Clear refresh token from database
      const decoded = fastify.jwt.verify(refreshToken)
      await fastify.models.User.update(
        { refresh_token: null, is_online: false },
        { where: { id: decoded.id } }
      )
    }
    
    // Clear refresh token cookie
    reply.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
    
    return reply.send({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[logout] Error:', error)
    return reply.code(500).send({ error: 'Logout failed' })
  }
})}