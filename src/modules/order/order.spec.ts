import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import { registerPlugins } from '../../plugins/register-plugins'
import { registerModules } from '../register-modules'
import { prisma } from '../../plugins/prisma'
import { $Enums } from '../../../generated/prisma'
import OrderStatus = $Enums.OrderStatus

let app: ReturnType<typeof Fastify>
let createdCustomerId: string
let createdOrderId: string

beforeEach(async () => {
  app = Fastify()
  await registerPlugins(app)
  await registerModules(app)

  await prisma.order.deleteMany({
    where: {
      customerId: 'test-customer-id',
    },
  })

  await prisma.customer.deleteMany({
    where: {
      id: 'test-customer-id',
    },
  })

  const customer = await prisma.customer.create({
    data: {
      id: 'test-customer-id',
      name: 'Test Customer',
      email: 'test-customer@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  })
  createdCustomerId = customer.id
})

afterEach(async () => {
  await app.close()
})

describe('Order CRUD', () => {
  it('should create a fake order', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/orders/create',
      payload: {
        customerId: createdCustomerId,
        orderTemplate: {
          orderNumber: 'XYZ123',
          status: OrderStatus.PENDING,
        },
      },
    })
    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('id')
    createdOrderId = body.id
  })

  it('should return filtered orders', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/orders/filter?status=PENDING&limit=1',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body)).toBe(true)
  })

  it('should return all orders', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/orders',
    })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toBeInstanceOf(Array)
  })

  it('should update an order', async () => {
    const resCreate = await app.inject({
      method: 'POST',
      url: '/orders/create',
      payload: {
        customerId: createdCustomerId,
        orderTemplate: {
          orderNumber: 'XYZ123',
          status: OrderStatus.QUARANTINE,
        },
      },
    })
    const bodyCreate = JSON.parse(resCreate.body)
    const orderId = bodyCreate.id

    const res = await app.inject({
      method: 'PATCH',
      url: `/orders/${orderId}`,
      payload: { status: OrderStatus.COMPLETED },
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.status).toBe(OrderStatus.COMPLETED)
  })

  it('should delete an order', async () => {
    const resCreate = await app.inject({
      method: 'POST',
      url: '/orders/create',
      payload: {
        customerId: createdCustomerId,
        orderTemplate: {
          orderNumber: 'XYZ123',
          status: OrderStatus.PENDING,
        },
      },
    })
    const bodyCreate = JSON.parse(resCreate.body)
    const orderId = bodyCreate.id

    const res = await app.inject({
      method: 'DELETE',
      url: `/orders/${orderId}`,
    })
    expect(res.statusCode).toBe(204)
  })
})
