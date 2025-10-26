// sequelize/sequelize.js
import fp from 'fastify-plugin'
import models, { sequelize } from '../models/index.js'

export default fp(async function (fastify) {
  // Sincronizza DB (crea tabelle se mancano)
  await sequelize.sync() // metti { force: true } per forzare drop + recreate

  // Decora Fastify
  fastify.decorate('sequelize', sequelize)
  fastify.decorate('models', models)

  // Chiudi connessione DB on server close
  fastify.addHook('onClose', async () => {
    await sequelize.close()
  })
})
