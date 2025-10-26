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
        const { opponentId, playerScore, opponentScore } = req.body

        // Validate input
        if (!opponentId || playerScore == null || opponentScore == null) {
            return reply.code(400).send({ error: 'Missing required fields' })
        }
        try {
            const newMatch = await fastify.models.MatchHistory.create({
                winner_id: playerScore > opponentScore ? decoded.id : opponentId,
                loser_id: playerScore > opponentScore ? opponentId : decoded.id,
                score_winner: Math.max(playerScore, opponentScore),
                score_loser: Math.min(playerScore, opponentScore),
                played_at: new Date()
            })
            return reply.code(200).send({ message: 'Match recorded successfully' })
        } catch (error) {
            console.error('Error creating match history:', error)
            return reply.code(500).send({ error: 'Internal Server Error' })
        }
    })
}