export default async function (fastify, opts) {
    fastify.get('/users', async function (request, reply) {
        const users = await fastify.models.User.findAll({
        attributes: ['id', 'username', 'email', 'avatar', 'is_online', 'won_matches', 'lost_matches', 'createdAt'],
        order: [['createdAt', 'ASC']],
    })
    return users
  })
}
