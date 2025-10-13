import { authenticateToken } from '../auth/middleware.js'

export default async function (fastify) {
    fastify.get('/user/:id', { prehandler: authenticateToken }, async function (request, reply) {
    try {
      const user = await fastify.models.User.findOne({
        where: { id: request.params.id },
        attributes: ['id', 'username', 'email', 'avatar', 'is_online', 'won_matches', 'lost_matches', 'createdAt']
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
}