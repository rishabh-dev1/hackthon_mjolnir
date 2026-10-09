const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')
  const csvFilePath = path.resolve(__dirname, '../../dataset/meesho_dataset-main/meesho_generated.csv')
  
  if (!fs.existsSync(csvFilePath)) {
    console.log('CSV file not found at:', csvFilePath)
    return
  }

  const csvData = fs.readFileSync(csvFilePath, 'utf-8')
  const lines = csvData.split('\n').filter(line => line.trim() !== '')
  
  // Skip header
  const headers = lines[0].split(',')
  const products = []

  console.log(`Found ${lines.length - 1} products to seed.`)
  
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parsing handling quotes if any
    const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',')
    
    if (row.length < 21) continue;

    const clean = (str) => str ? str.replace(/^"|"$/g, '').trim() : ''

    const p = {
      productId: clean(row[0]),
      title: clean(row[1]),
      category: clean(row[2]),
      subcategory: clean(row[3]),
      brand: clean(row[4]),
      originalPrice: parseFloat(clean(row[5])) || 0,
      discountedPrice: parseFloat(clean(row[6])) || 0,
      discountPercentage: parseFloat(clean(row[7])) || 0,
      rating: parseFloat(clean(row[8])) || 0,
      reviewCount: parseInt(clean(row[9])) || 0,
      availability: clean(row[10]),
      sellerName: clean(row[11]),
      imageUrl: clean(row[12]),
      productUrl: clean(row[13]),
      description: clean(row[14]),
      colorsAvailable: clean(row[15]),
      sizesAvailable: clean(row[16]),
      material: clean(row[17]),
      codAvailable: clean(row[18]).toLowerCase() === 'true',
      returnPolicy: clean(row[19]),
      deliveryTime: clean(row[20])
    }
    products.push(p)
  }

  // Seed user
  const user = await prisma.user.upsert({
    where: { email: 'demo@meesho.com' },
    update: {},
    create: {
      email: 'demo@meesho.com',
      name: 'Demo User'
    }
  })

  // Bulk insert products
  let count = 0
  for (const product of products) {
    try {
      await prisma.product.upsert({
        where: { productId: product.productId },
        update: product,
        create: product
      })
      count++
      if(count % 100 === 0) console.log(`Seeded ${count} products...`)
    } catch(err) {
      // ignore
    }
  }

  console.log(`Seeding finished. Seeded ${count} products.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
