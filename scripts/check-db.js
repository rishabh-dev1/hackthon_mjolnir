const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const productCount = await p.product.count()
  const userCount = await p.user.count()
  const orderCount = await p.order.count()
  const historyCount = await p.priceHistory.count()
  const lockCount = await p.flashCheckoutLock.count()

  console.log('Product count:', productCount)
  console.log('User count:', userCount)
  console.log('Order count:', orderCount)
  console.log('PriceHistory count:', historyCount)
  console.log('FlashCheckoutLock count:', lockCount)

  const sample = await p.product.findFirst()
  console.log('\nSample product:')
  console.log(JSON.stringify(sample, null, 2))

  const categories = await p.product.groupBy({ by: ['category'], _count: { id: true } })
  console.log('\nCategories:', categories.map(c => `${c.category}(${c._count.id})`).join(', '))
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect())
