'use strict'

import path from 'path'
import AutoLoad from '@fastify/autoload'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import multipart from '@fastify/multipart'
import fastifyCookie from '@fastify/cookie'
import { authenticateToken } from './routes/auth/middleware.js'


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Pass --options via CLI arguments in command to enable these options.
export const options = {};

export default async function (fastify, opts) {

  await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'your-cookie-secret'
  })

  await fastify.register(multipart, {
  attachFieldsToBody: true,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
  });

  fastify.addHook('preHandler', authenticateToken);

  await fastify.register(import('./sequelize/sequelize.js'));

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts)
  })

  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'models'),
    options: Object.assign({}, opts)
  })

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/', // Serve files under /public/
  })

  fastify.get('/register', (req, reply) => {
    return reply.sendFile('register.html') // file dentro /public
  })
  
  fastify.get('/login', (req, reply) => {
    return reply.sendFile('login.html') // file dentro /public
  })

  fastify.get('/users', (req, reply) => {
  return reply.sendFile('user.html') // Stesso HTML, ma con userId nel URL
})
}
  // Do not touch the previous lines
  // Place here your custom code!;