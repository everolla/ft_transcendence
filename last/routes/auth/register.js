'use strict'

import fs from 'fs'
import path from 'path'
import bcrypt from 'bcrypt'
import validator from 'validator'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

const pump = promisify(pipeline)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function (fastify) {

  fastify.post('/register', async function (request, reply) {
    console.log('[register] handler start')
    let avatarFile = null
    const data = {}

    try {
      if (request.isMultipart && request.isMultipart()) {
        console.log('[register] request is multipart')

        // Caso: attachFieldsToBody: true -> request.body può contenere campi multipart (oggetti)
        if (request.body && Object.keys(request.body).length > 0) {

          const body = {}
          for (const key in request.body) {
            const val = request.body[key]

            if (val && typeof val === 'object' && 'value' in val) {
              body[key] = val.value
            } else {
              body[key] = val
            }

            // rileva avatar se presente come oggetto con .file o .data
            if (key === 'avatar' && val) {
              avatarFile = val
            }
          }

          request.body = body
        } else {
          // Caso: attachFieldsToBody non attivo -> leggiamo dai parts()
          let partIndex = 0
          for await (const part of request.parts()) {
            partIndex += 1

            if (part.file && part.fieldname === 'avatar') {
              avatarFile = part
            } else if (part.file) {
              // scarta lo stream (non await)
              part.file.resume()
            } else {
              // campo di testo
              data[part.fieldname] = part.value
            }
          }
          request.body = data
        }
      } else {
        // Non multipart
        Object.assign(data, request.body || {})
        request.body = data
      }

      // Dopo parsing, mostra cosa abbiamo

      const { username, email, password } = request.body || {}

      // --- Validazioni ---
      if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return reply.code(400).send({ error: 'Username must be alphanumeric (3-20 characters)' })
      }

      if (!email || !validator.isEmail(email)) {
        return reply.code(400).send({ error: 'Email empty or not valid' })
      }

      if (!password || password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
        return reply.code(400).send({
          error: 'Password must be at least 8 characters long and include uppercase, lowercase, number and special character'
        })
      }

      // --- Controllo univocità ---
      const existingUser = await fastify.models.User.findOne({ where: { username } })
      if (existingUser) {
        return reply.code(409).send({ error: 'Username already exists' })
      }

      const existingEmail = await fastify.models.User.findOne({ where: { email } })
      if (existingEmail) {
        return reply.code(409).send({ error: 'Email already exists' })
      }

      // --- Hash password ---
      const hashedPassword = await bcrypt.hash(password, 10)

      let avatarPath = null
      if (avatarFile) {
        fastify.log.info({ avatarFileKeys: Object.keys(avatarFile) }, 'avatarFile keys')

        const rawFilename = avatarFile.filename || avatarFile.name || `avatar-${Date.now()}`
        const safeFilename = encodeURIComponent(rawFilename)
        const uploadDir = path.join(__dirname, '..', '..', 'public', 'avatars', username)
        const filepath = path.join(uploadDir, safeFilename)

        fs.mkdirSync(uploadDir, { recursive: true })

        try {
          // 1) tentativo stream (se esiste)
          if (avatarFile.file && typeof avatarFile.file.pipe === 'function') {
            fastify.log.info('Attempting to save avatar via stream to', filepath)
            try {
              await pump(avatarFile.file, fs.createWriteStream(filepath))
            } catch (e) {
              fastify.log.warn(e, 'pump() failed or stream ended early')
            }
          }

          // 2) controlla dimensione file scritto
          let stat = fs.existsSync(filepath) ? fs.statSync(filepath) : null
          fastify.log.info({ filepath, size: stat ? stat.size : null }, 'After initial write - file stat')

          // 3) se size === 0 o file non esistente: prova fallback buffer
          if (!stat || stat.size === 0) {
            // preferisci .toBuffer() se disponibile
            if (typeof avatarFile.toBuffer === 'function') {
              fastify.log.info('Trying avatarFile.toBuffer() fallback')
              try {
                const buf = await avatarFile.toBuffer()
                if (buf && buf.length) fs.writeFileSync(filepath, buf)
                fastify.log.info('Wrote buffer from toBuffer(), length:', buf ? buf.length : 0)
              } catch (e) {
                fastify.log.warn(e, 'avatarFile.toBuffer() failed')
              }
            } else if (avatarFile._buf && Buffer.isBuffer(avatarFile._buf)) {
              fastify.log.info('Using avatarFile._buf fallback, length:', avatarFile._buf.length)
              fs.writeFileSync(filepath, avatarFile._buf)
            } else if (avatarFile.data && Buffer.isBuffer(avatarFile.data)) {
              fastify.log.info('Using avatarFile.data fallback, length:', avatarFile.data.length)
              fs.writeFileSync(filepath, avatarFile.data)
            } else {
              fastify.log.warn('No buffer fallback available on avatarFile', Object.keys(avatarFile))
            }

            // rileggi stat dopo fallback
            stat = fs.existsSync(filepath) ? fs.statSync(filepath) : null
            fastify.log.info({ filepath, size: stat ? stat.size : null }, 'After fallback write - file stat')
          }

          // 4) validazione finale: dimensione > 0
          if (!stat || stat.size === 0) {
            // cleanup file vuoto se presente
            try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath) } catch (e) { fastify.log.warn(e) }
            fastify.log.warn('Avatar file could not be saved (zero size) - continuing without avatar')
            avatarPath = null // ✅ Continua senza avatar invece di abortire
          }
          else {
          // 5) se siamo qui il file è ok
          avatarPath = `/avatars/${username}/${safeFilename}`
          fastify.log.info('Avatar successfully saved', { filepath, avatarPath, size: stat.size })
        }
      } catch (err) {
          fastify.log.error(err, 'Errore durante salvataggio avatar')
          // rimuovi file parziale
          try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath) } catch (e) { fastify.log.warn(e) }
          return reply.code(500).send({ error: 'Error saving avatar file' })
        }
      } else {
        fastify.log.info('No avatarFile provided for this request')
      }

      // --- Creazione utente ---
      console.log('[register] creating user in DB...')
      const newUser = await fastify.models.User.create({
        username,
        email,
        password: hashedPassword,
        ...(avatarPath ? { avatar: avatarPath } : {})
      })

      const OTP = Math.floor(100000 + Math.random() * 900000).toString()
      await fastify.mailer.sendMail({
        to: email,
        subject: 'Verify your account',
        text: `Your OTP is: ${OTP}`
      })

      await fastify.models.OTP.create({
        user_id: newUser.id,
        otp_code: OTP
      })

      console.log('[register] user created successfully')
      return reply.code(201).send({ User: { email: newUser.email}, message: 'User registered successfully'})
    } catch (err) {
      console.error('[register] unexpected error:', err)
      return reply.code(500).send({ error: 'Internal server error' })
    }
  })
}
