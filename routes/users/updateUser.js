import { authenticateToken } from '../auth/middleware.js'
import path from 'path'
import fs from 'fs'

export default async function (fastify) {
fastify.patch('/users/user/:id', { preHandler: authenticateToken }, async (req, reply) => {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token) return reply.code(401).send({ error: 'No token provided' })
    let decoded
    try {
    decoded = fastify.jwt.verify(token)
    } catch (err) {
    return reply.code(403).send({ error: 'Failed to authenticate token' })
    }
    if (decoded.id !== parseInt(req.params.id, 10)) {
    return reply.code(403).send({ error: 'You can only update your own profile' })
    }
    const { username, email, password } = req.body
    const avatarFile = req.file
    if (avatarFile && !['image/jpeg', 'image/png', 'image/gif'].includes(avatarFile.mimetype)) {
    return reply.code(400).send({ error: 'Invalid avatar file type' })
    }

    if (avatarFile) {
    const uploadDir = path.join(__dirname, '../../public/avatars', username)
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
    }
    const filePath = path.join(uploadDir, avatarFile.filename)
    fs.writeFileSync(filePath, avatarFile.data)
    }

    const hashPassword = async (pwd) => {
    const salt = await fastify.bcrypt.genSalt(10)
    return fastify.bcrypt.hash(pwd, salt)
    }

    // aggiornamento utente
    const user = await fastify.models.User.findByPk(req.params.id)
    if (!user) return reply.code(404).send({ error: 'User not found' })

    if (username) user.username = username
    if (email) user.email = email
    if (password) user.password = await hashPassword(password)
    if (avatarFile) {
    const filePath = `/avatars/${user.username}/${avatarFile.filename}`
    user.avatar = filePath
    }

    await user.save()
    reply.send(user)
    })
}

    // --- REGISTER ---