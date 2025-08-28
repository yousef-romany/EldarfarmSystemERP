
import { PrismaClient } from '@prisma/client'
import { adminPermissions, developerPermissions } from '../src/lib/data';

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      permissions: JSON.stringify(adminPermissions),
    },
    create: {
        username: 'admin',
        password: 'admin123', // In a real app, this should be hashed!
        role: 'ADMIN',
        permissions: JSON.stringify(adminPermissions),
        // avatar: `https://i.pravatar.cc/150?u=admin`
    }
  });
  console.log(`Created admin user: ${adminUser.username}`);

  const devUser = await prisma.user.upsert({
    where: { username: 'dev' },
    update: {
      permissions: JSON.stringify(developerPermissions),
    },
    create: {
        username: 'dev',
        password: 'dev123', // In a real app, this should be hashed!
        role: 'DEVELOPER',
        permissions: JSON.stringify(developerPermissions),
    }
  });
  console.log(`Created developer user: ${devUser.username}`);

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
