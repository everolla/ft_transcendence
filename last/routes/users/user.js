import { authenticateToken } from '../auth/middleware.js'

export default async function (fastify) {
  fastify.get('/user/:id', { prehandler: authenticateToken }, async function (request, reply) {
    try {
      const token = request.headers['authorization']?.split(' ')[1]
      if (!token) return reply.code(401).send({ error: 'No token provided' })
      let decoded
      try {
      decoded = fastify.jwt.verify(token)
      } catch (err) {
      return reply.code(403).send({ error: 'Failed to authenticate token' })
      }
      if (decoded.id !== parseInt(request.params.id, 10)) {
      return reply.code(403).send({ error: 'Failed to authenticate token' })
      }
      const user = await fastify.models.User.findOne({
        where: { id: request.params.id },
        attributes: [
          'id',
          'username',
          'email',
          'avatar',
          'is_online',
          'won_matches',
          'lost_matches',
          'createdAt'
        ],
        include: [
          {
            model: fastify.models.User,
            as: 'friends',
            attributes: ['id', 'username', 'avatar', 'is_online'],
            through: { attributes: [],
              where: { accepted: true }
             }
          },
          {
            model: fastify.models.MatchHistory,
            as: 'matches',
            attributes: ['id', 'opponent_name', 'player_score', 'opponent_score', 'played_at'],
          }
        ]
      })
      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }
      return reply.send(user)
    } catch (error) {
      console.error('[get user] Error:', error)
      return reply.code(500).send({ error: 'Failed to fetch user' })
    }
  })

  fastify.delete('/user/:id', { prehandler: authenticateToken }, async function (request, reply) {
    const token = request.headers['authorization']?.split(' ')[1]
    if (!token) return reply.code(401).send({ error: 'No token provided' })
    let decoded
    try {
    decoded = fastify.jwt.verify(token)
    } catch (err) {
    return reply.code(403).send({ error: 'Failed to authenticate token' })
    }
    if (decoded.id !== parseInt(request.params.id, 10)) {
    return reply.code(403).send({ error: 'You cannot delete another user' })
    }
    try {
      const user = await fastify.models.User.findOne({ where: { id: decoded.id }})
      if (!user) {
          return reply.code(404).send({ error: 'User not found' })
        }
      await user.destroy()
    return reply.code(200).send({ message: 'User deleted successfully' })
    } catch (error) {
      console.error('[delete user] Error:', error)
      return reply.code(500).send({ error: 'Failed to delete user' })
    }
  })
}

