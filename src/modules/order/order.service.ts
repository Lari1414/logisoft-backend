import { prisma } from '../../plugins/prisma'
import { faker } from '@faker-js/faker'
import { OrderStatus } from '../../../generated/prisma'

export const getAllOrders = () => prisma.order.findMany()

export const getSampleOrder = () => ({
  id: faker.string.uuid(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  deletedAt: null,
  orderNumber: faker.string.alphanumeric(8),
  customerId: faker.string.uuid(),
  status: faker.helpers.arrayElement(Object.values(OrderStatus)),
})

export type OrderTemplate = {
  orderNumber: string
  status: OrderStatus
}

export const getSampleOrderTemplate = (): OrderTemplate => ({
  orderNumber: faker.string.alphanumeric(8),
  status: faker.helpers.arrayElement(Object.values(OrderStatus)),
})

export type OrderSearch = {
  status?: string
  orderNumber?: string
  id?: string
}

export const createOrder = async ({
  customerId,
  orderTemplate,
}: {
  customerId: string
  orderTemplate?: OrderTemplate
}) => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  })

  if (!customer) {
    throw new Error(`Customer with id ${customerId} not found`)
  }

  const template = orderTemplate ?? getSampleOrderTemplate()
  return prisma.order.create({
    data: {
      customerId,
      ...template,
    },
  })
}

export const filterOrders = async (
  search: OrderSearch,
  limit = 10,
  offset = 0,
) => {
  const where: any = {}

  if (search.status) {
    where.status = search.status as OrderStatus
  }
  if (search.orderNumber) {
    where.orderNumber = search.orderNumber
  }
  if (search.id) {
    where.id = search.id
  }

  return prisma.order.findMany({
    where,
    take: limit,
    skip: offset,
  })
}

export const updateOrder = async (id: string, status: OrderStatus) => {
  return prisma.order.update({
    where: { id },
    data: { status: status },
  })
}

export const deleteOrder = async (id: string) => {
  return prisma.order.delete({ where: { id } })
}
