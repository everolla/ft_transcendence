import { authenticateToken } from '../auth/middleware.js'


export default async function (fastify) {

    fastify.post('/match/:id', { preHandler: authenticateToken }, async (req, reply) => {
        const token = req.headers['authorization']?.split(' ')[1]
        if (!token) return reply.code(401).send({ error: 'No token provided' })
        let decoded
        try {
        decoded = fastify.jwt.verify(token)
        } catch (err) {
        return reply.code(403).send({ error: 'Failed to authenticate token' })
        }
        if (decoded.id !== parseInt(req.params.id, 10)) {
        return reply.code(403).send({ error: 'You are not allowed to start a match' })
        }
        const { opponentName, playerScore, opponentScore } = req.body

        // Validate input
        if (!opponentName || playerScore == null || opponentScore == null) {
            return reply.code(400).send({ error: 'Missing required fields' })
        }
        try {
            const newMatch = await fastify.models.MatchHistory.create({
                player_id: decoded.id,
                opponent_name: opponentName,
                player_score: playerScore,
                opponent_score: opponentScore,
                played_at: new Date()
            })
            user = await fastify.models.User.findbyPK(decoded.id)
            if (!user) return reply.code(404).send({ error: 'User not found' })
            if (playerScore > opponentScore)
                user.won_matches += 1
            else
                user.lost_matches += 1
            await user.save()
            return reply.code(200).send({ message: 'Match recorded successfully' })
        } catch (error) {
            console.error('Error creating match history:', error)
            return reply.code(500).send({ error: 'Internal Server Error' })
        }
    })
}