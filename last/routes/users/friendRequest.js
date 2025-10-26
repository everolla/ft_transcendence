import { authenticateToken } from '../auth/middleware.js'

export default async function (fastify) {
    fastify.get('/friendRequest/:id', { prehandler: authenticateToken }, async function (request, reply) {
    try {
        const token = request.headers['authorization']?.split(' ')[1]
        if (!token) return reply.code(401).send({ error: 'No token provided' })
            let decoded
        try {
            decoded = fastify.jwt.verify(token)
        } catch (err) {
            console.error('[friendRequest] JWT verification failed:', err)
            return reply.code(403).send({ error: 'Failed to authenticate token' })
        }
        if (decoded.id !== parseInt(request.params.id, 10)) {
            return reply.code(403).send({ error: 'Failed to authenticate token' })
        }
        const user = await fastify.models.User.findOne({ where: { id: decoded.id } })
        if (!user) return reply.code(404).send({ error: 'User not found' })
        pendingRequests = await fastify.models.Friend.findAll({
        where: {friend_id: user.id,
        accepted: false 
        }})
        return reply.code(200).send({ requests: pendingRequests })
      }
      catch (err) {
        console.error('[friendRequest GET] Unexpected error:', err)
        return reply.code(500).send({ error: 'An unexpected error occurred' })
    }
})

  fastify.post('/friendRequest/:id', { prehandler: authenticateToken }, async function (request, reply) {
    try {
      const token = request.headers['authorization']?.split(' ')[1]
      if (!token) return reply.code(401).send({ error: 'No token provided' })

      let decoded
      try {
        decoded = fastify.jwt.verify(token)
      } catch (err) {
        console.error('[friendRequest] JWT verification failed:', err)
        return reply.code(403).send({ error: 'Failed to authenticate token' })
      }

      if (decoded.id !== parseInt(request.params.id, 10)) {
        return reply.code(403).send({ error: 'Failed to authenticate token' })
      }

      const user = await fastify.models.User.findOne({ where: { id: decoded.id } })
      if (!user) return reply.code(404).send({ error: 'User not found' })

      const { friendId } = request.body
      if (!friendId) return reply.code(400).send({ error: 'friendId not provided' })

      const existingRequest = await fastify.models.Friend.findOne({
        where: {
          [fastify.Sequelize.Op.or]: [
            { user_id: user.id, friend_id: friendId },
            { user_id: friendId, friend_id: user.id }
          ]
        }
      })

      if (existingRequest) {
        return reply.code(400).send({ error: 'Friend request already sent or exists' })
      }

      try {
        await fastify.models.Friend.create({
          user_id: user.id,
          friend_id: friendId,
          accepted: false
        })
        return reply.code(201).send({ message: 'Friend request sent successfully' })
      } catch (err) {
        console.error('[friendRequest] Failed to create Friend entry:', err)
        return reply.code(500).send({ error: 'Failed to send friend request' })
      }

    } catch (err) {
      console.error('[friendRequest] Unexpected error:', err)
      return reply.code(500).send({ error: 'An unexpected error occurred' })
    }
  })


    fastify.patch('/friendRequest/:id', {prehandler: authenticateToken }, async function (request, reply) {
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
        const user = await fastify.models.User.findOne({where: { id: decoded.id}})
        if (!user) return reply.code(404).send({ error: 'User not found' })
        const { friendId } = request.body
        if (!friendId) return reply.code(400).send({ error: 'friendId not provided' })
        const friend = await fastify.models.User.findOne({where: { id: friendId}})
        if (!friend) return reply.code(404).send({ error: 'Friend id not found' })
        const friendRequest = await fastify.models.Friend.findOne({
        where: {
            user_id: friendId,
            friend_id: user.id,
            accepted: false
        }
        })
        if (!friendRequest)
            return reply.code(400).send('Friend Request doesnt exist')
        try{
            friendRequest.accepted = true
            await friendRequest.save()
            return reply.code(201).send({ message: 'Friend request accepted successfully' })
        }
        catch (err){
            console.error('[friendRequest] Unexpected error:', err)
            return reply.code(500).send({ message: 'Failed to send friend request'})
        }
    }
    catch (err) {
      console.error('[friendRequest] Unexpected error:', err)
      return reply.code(500).send({ error: 'An unexpected error occurred' })
    }
    })
}