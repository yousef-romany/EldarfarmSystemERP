
import { PrismaClient } from '@prisma/client'
import { defaultPermissions, adminPermissions } from '../src/lib/data';

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
        username: 'admin',
        password: 'admin123', // In a real app, this should be hashed!
        role: 'ADMIN',
        permissions: JSON.stringify(adminPermissions),
        avatar: `https://i.pravatar.cc/150?u=admin`
    }
  });
  console.log(`Created admin user: ${adminUser.username}`);

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
