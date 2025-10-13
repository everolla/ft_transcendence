'use strict'

import bcrypt from 'bcrypt'

export default async function (fastify) {

  fastify.post('/login', async function (request, reply) {
    console.log('[login] handler start')
    const { email, password } = request.body || {}

    // Validazione input
    if (!email || !password) {
      return reply.status(400).send({ error: 'Missing email or password' })
    }
    
    if (typeof email !== 'string' || typeof password !== 'string') {
      return reply.status(400).send({ error: 'Invalid data types for email or password' })
    }
    
    if (email.length < 3 || email.length > 30) {
      return reply.status(400).send({ error: 'Invalid email format' })
    }
    console.log(`[login] Received login attempt for email: ${email}`)

    try {
      // Cerca utente nel DB
      const user = await fastify.models.User.findOne({ where: { email } })

      // password hash fittizia per timing attack
      const fakeHash = '$2b$10$C6UzMDM.H6dfI/f/IKcEe.LhJtFhH1wM/dIjp3y8kTbP/1B6T8CqW' // bcrypt hash casuale

      // confronto password uniforme
      const isValidPassword = await bcrypt.compare(password, user ? user.password : fakeHash)

      if (!user || !isValidPassword) {
        return reply.status(401).send({ error: 'Invalid username or password' }) // risposta uniforme
      }

      OTP = Math.floor(100000 + Math.random() * 900000).toString()
      await fastify.mailer.sendMail({
        to: email,
        subject: 'Verify your account',
        text: `Your OTP is: ${OTP}`
      })

      return reply.status(200).send({
        otp: OTP,
        user: { email: user.email },
        message: 'Login successful'
      })
    } catch (error) {
      console.error('[login] Error occurred:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}
