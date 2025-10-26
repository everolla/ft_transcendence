//CHIEDERE A LUCA COME FUNZIONA LA VERIFICA DELL ACCESS E REFRESH TOKEN, SE SONO FUNZIONI O END POINT

export default async function (fastify) {

  fastify.post('/refresh', async function (request, reply) {
    try {
      const { refreshToken } = request.cookies
      
      if (!refreshToken) {
        return reply.code(401).send({ error: 'Refresh token not found' })
      }

      // Verify refresh token
      const decoded = fastify.jwt.verify(refreshToken)
      
      // Find user and validate refresh token in database
      const user = await fastify.models.User.findOne({ 
        where: { 
          id: decoded.id,
          refresh_token: refreshToken // Ensure token matches database
        } 
      })

      if (!user) {
        return reply.code(403).send({ error: 'Invalid refresh token' })
      }

      // Generate new access token
      const newAccessToken = fastify.jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        },
        { expiresIn: '15m' }
      )

      // Refresh token for enhanced security
      const newRefreshToken = fastify.jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        { expiresIn: '7d' }
      )

      // Update refresh token in database
      await user.update({ refresh_token: newRefreshToken })

      // Update refresh token cookie
      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      })

      // Only send access token to client
      return reply.send({ 
        accessToken: newAccessToken
      })

    } catch (error) {
      console.error('[refresh] Token refresh error:', error)
      return reply.code(403).send({ error: 'Invalid refresh token' })
    }
  })
}