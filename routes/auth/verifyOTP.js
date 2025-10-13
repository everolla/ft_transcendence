//create and verify OTP

//   CHIEDERE A LUCHINO SE DEVE ESSERE POST, SE DEVE ESSERE UNA FUNZONE E NON UN ENDPOINT

export default async function (fastify) {

  fastify.post('/verifyOTP', async function (request, reply) {
    console.log('[verify] handler start')
    const { email, OTP } = request.body || {}

    // Validazione input
    if (!email) {
    return reply.code(400).send({ error: 'Missing email' })
    }

    if (typeof email !== 'string') {
    return reply.code(400).send({ error: 'Invalid data type for email' })
    }

    if (email.length < 3 || email.length > 30) {
    return reply.code(400).send({ error: 'Invalid email format' })
    }

    if (!OTP) {
    return reply.code(400).send({ error: 'Missing OTP' })
    }

    try {
        // Cerca utente nel DB
        const user = await fastify.models.User.findOne({ where: { email } })
        if (!user) {
        return reply.code(404).send({ error: 'User not found' })
        }

        const userOTP = await fastify.models.OTP.findOne({ where: { user_id: user.id } })
        if (!userOTP) {
        return reply.code(404).send({ error: 'OTP not found for user' })
        }

        if (String(userOTP.otp_code) !== String(OTP)) {
        return reply.code(400).send({ error: 'Invalid OTP code' })
        }

        if (new Date() > new Date(userOTP.expires_at)) {
        return reply.code(400).send({ error: 'OTP code has expired' })
        }

        const accessToken = fastify.jwt.sign({ id: user.id, username: user.username, email: user.email }, { expiresIn: '15h' })
        const refreshToken = fastify.jwt.sign({ id: user.id, username: user.username, email: user.email }, { expiresIn: '7d' })

        await user.update({ refresh_token: refreshToken, is_online: true })

        reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
        })

        await fastify.models.OTP.destroy({ where: { user_id: user.id } })        

        return reply.code(200).send({ message: "OTP verified successfully", token: accessToken });

        } catch (error) {
    console.error('[verify] Error occurred:', error)
    return reply.code(500).send({ error: 'Internal server error' })
    }
})}