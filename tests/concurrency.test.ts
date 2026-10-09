import test from 'node:test'
import assert from 'node:assert'
import { PrismaClient } from '@prisma/client'
import { spawn } from 'node:child_process'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()

// We will run the server on 3001
const PORT = 3001
const BASE_URL = `http://localhost:${PORT}`
process.env.NEXTAUTH_SECRET = 'test-secret-32-chars-long-minimum!'
process.env.CRON_SECRET = 'test-cron-secret'

// Helper to generate cookie header
async function getCookieHeader(userId: string) {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
  const token = await new SignJWT({ sub: userId, role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret)
  return `meesho_token=${token}`
}

test('Concurrency and Checkout Lifecycle Tests (E2E)', async (t) => {
  let user1: any, user2: any, product: any
  let serverProcess: any

  await t.test('Boot Next.js Server', async () => {
    // Start Next.js server
    serverProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '-p', String(PORT)], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'ignore', // don't clog test output
      shell: true,
    })
    
    // Wait for server to be ready
    let attempts = 0
    while (attempts < 20) {
      try {
        await fetch(`${BASE_URL}/`)
        break
      } catch (e) {
        attempts++
        await new Promise(r => setTimeout(r, 1000))
      }
    }
    assert(attempts < 20, 'Server failed to start in time')
  })

  await t.test('Setup isolated data', async () => {
    await prisma.flashCheckoutLock.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.user.deleteMany()

    user1 = await prisma.user.create({ data: { email: 'u1@test.com', name: 'User 1' } })
    user2 = await prisma.user.create({ data: { email: 'u2@test.com', name: 'User 2' } })

    product = await prisma.product.create({
      data: {
        productId: 'TEST_PROD_2',
        title: 'Last Item Server',
        category: 'Test',
        subcategory: 'Test',
        brand: 'Test',
        originalPrice: 100,
        discountedPrice: 80,
        discountPercentage: 20,
        rating: 5,
        reviewCount: 1,
        availability: 'In Stock',
        stockCount: 1, // Exactly 1 unit left
        sellerName: 'Tester',
        imageUrl: '',
        productUrl: '',
        description: '',
        colorsAvailable: '',
        sizesAvailable: '',
        material: '',
        codAvailable: true,
        returnPolicy: '',
        deliveryTime: ''
      }
    })
  })

  await t.test('1. Concurrent reservations for last product', async () => {
    const c1 = await getCookieHeader(user1.id)
    const c2 = await getCookieHeader(user2.id)

    const payload = JSON.stringify({ items: [{ productId: product.id, quantity: 1 }] })
    
    const req1 = fetch(`${BASE_URL}/api/cart/checkout`, {
      method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', cookie: c1 }
    })
    const req2 = fetch(`${BASE_URL}/api/cart/checkout`, {
      method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', cookie: c2 }
    })

    const [res1, res2] = await Promise.all([req1, req2])

    const statuses = [res1.status, res2.status].sort()
    assert.deepStrictEqual(statuses, [200, 409], 'Exactly one request succeeds, one fails with 409')

    const dbProduct = await prisma.product.findUnique({ where: { id: product.id } })
    assert.strictEqual(dbProduct?.stockCount, 0, 'Stock count must be decremented to 0')
  })

  await t.test('2. Successful checkout confirmation & idempotency', async () => {
    const orders = await prisma.order.findMany({ where: { status: 'PENDING' } })
    assert.strictEqual(orders.length, 1, 'Should have exactly 1 pending order')
    const order = orders[0]

    const cookie = await getCookieHeader(order.userId)
    const payload = JSON.stringify({ orderId: order.id })

    // Confirm order
    const res = await fetch(`${BASE_URL}/api/cart/confirm`, {
      method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', cookie }
    })
    assert.strictEqual(res.status, 200, 'Confirmation succeeds')

    const locks = await prisma.flashCheckoutLock.findMany()
    assert.strictEqual(locks.length, 0, 'Locks are deleted upon confirmation')

    // Idempotent retry
    const resRetry = await fetch(`${BASE_URL}/api/cart/confirm`, {
      method: 'POST', body: payload, headers: { 'Content-Type': 'application/json', cookie }
    })
    const retryData = await resRetry.json()
    assert.strictEqual(retryData.message, 'Order is already confirmed', 'Returns idempotency success')
  })

  await t.test('3. Expiration and restoration of inventory (Cron Concurrency)', async () => {
    await prisma.product.update({ where: { id: product.id }, data: { stockCount: 0 } })
    
    const fakeOrder = await prisma.order.create({
      data: { userId: user1.id, total: 80, status: 'PENDING' }
    })

    await prisma.flashCheckoutLock.create({
      data: {
        productId: product.id, userId: user1.id, quantity: 1,
        expiresAt: new Date(Date.now() - 10000) // Expired
      }
    })

    const req1 = fetch(`${BASE_URL}/api/cron/cleanup-locks`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })
    const req2 = fetch(`${BASE_URL}/api/cron/cleanup-locks`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } })

    const [res1, res2] = await Promise.all([req1, req2])
    const data1 = await res1.json()
    const data2 = await res2.json()

    const totalCleaned = (data1.cleaned || 0) + (data2.cleaned || 0)
    assert.strictEqual(totalCleaned, 1, 'Only one cron clears the lock, avoiding double-increment')

    const dbProd = await prisma.product.findUnique({ where: { id: product.id } })
    assert.strictEqual(dbProd?.stockCount, 1, 'Stock properly restored to 1')

    const cancelledOrder = await prisma.order.findUnique({ where: { id: fakeOrder.id } })
    assert.strictEqual(cancelledOrder?.status, 'CANCELLED', 'Order marked CANCELLED')
  })

  await t.test('Teardown', async () => {
    if (serverProcess) serverProcess.kill()
    await prisma.$disconnect()
  })
})
