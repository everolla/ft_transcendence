import fastifyPlugin from 'fastify-plugin';
import fastifyEnv from '@fastify/env';
import fastifyJwt from '@fastify/jwt';

const envSchema = {
  type: 'object',
  required: ['port', 'host', 'jwtSecret', 'googleClientId', 'googleClientSecret'],
  properties: {
    port: { type: 'number', default: 3000 },
    host: { type: 'string', default: 'localhost' },
    jwtSecret: { type: 'string', default: 'your_jwt_secret' },
    googleClientId: { type: 'string', default: 'your_google_client_id' },
    googleClientSecret: { type: 'string', default: 'your_google_client_secret' },
    cookieSecret: { type: 'string', default: 'your_cookie_secret' },
    refreshSecret: { type: 'string', default: 'your_refresh_secret' }}
};

export default fastifyPlugin(async function (fastify) {
  await fastify.register(fastifyEnv, {
    confKey: 'env',
    schema: envSchema,
    dotenv: true
  });

  fastify.register(fastifyJwt, {
    secret: fastify.env.jwtSecret,
    sign: { expiresIn: '1h' }
  });
});
