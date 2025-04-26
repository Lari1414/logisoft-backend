import { FastifyInstance } from 'fastify'
import prismaPlugin from './prisma'
import swaggerPlugin from './swagger'

export async function registerPlugins(app: FastifyInstance) {
  app.register(prismaPlugin)
  app.register(swaggerPlugin)
}
