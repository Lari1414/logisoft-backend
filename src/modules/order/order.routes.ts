import { FastifyInstance } from 'fastify'
import {
  createOrder,
  deleteOrder,
  filterOrders,
  getAllOrders,
  getSampleOrder,
  OrderTemplate,
  updateOrder,
} from './order.service'
import { mapToOpenAPISchema } from '../../utils/openapi-schema'
import { OrderStatus } from '../../../generated/prisma'

type OrderSearch = {
  status?: string
  orderNumber?: string
  id?: string
}

type GetAllOrdersResponse = Awaited<ReturnType<typeof getAllOrders>>

export default async function orderRoutes(fastify: FastifyInstance) {
  // GET all orders
  fastify.get<{
    Reply: GetAllOrdersResponse
  }>(
    '',
    {
      schema: {
        response: {
          200: {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: mapToOpenAPISchema([getSampleOrder()]),
              },
            },
          },
        },
      },
    },
    async (_, reply) => {
      const orders = await getAllOrders()
      reply.send(orders)
    },
  )

  // POST create or fake order
  fastify.post<{ Body: { customerId: string; OrderTemplate?: OrderTemplate } }>(
    '/create',
    {
      schema: {
        response: {
          201: {
            description: 'Created order',
            content: {
              'application/json': {
                schema: mapToOpenAPISchema(getSampleOrder()),
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const newOrder = await createOrder({
        customerId: request.body.customerId,
        orderTemplate: request.body?.OrderTemplate,
      })
      reply.code(201).send(newOrder)
    },
  )

  // GET filtered orders
  fastify.get<{
    Querystring: OrderSearch & {
      limit?: number
      offset?: number
    }
  }>(
    '/filter',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            orderNumber: { type: 'string' },
            id: { type: 'string' },
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
        },
        response: {
          200: {
            description: 'Filtered orders',
            content: {
              'application/json': {
                schema: mapToOpenAPISchema([getSampleOrder()]),
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { status, orderNumber, id, limit = 10, offset = 0 } = request.query
      const search: OrderSearch = { status, orderNumber, id }
      const orders = await filterOrders(search, limit, offset)
      reply.send(orders)
    },
  )

  // PATCH update order
  fastify.patch<{
    Params: { id: string }
    Body: { status: OrderStatus }
  }>(
    '/:id',
    {
      schema: {
        response: {
          200: {
            description: 'Updated order',
            content: {
              'application/json': {
                schema: mapToOpenAPISchema(getSampleOrder()),
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const updated = await updateOrder(id, request.body.status)
      reply.send(updated)
    },
  )

  // DELETE order
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        response: {
          204: {
            description: 'Order deleted',
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      await deleteOrder(id)
      reply.code(204).send()
    },
  )
}
