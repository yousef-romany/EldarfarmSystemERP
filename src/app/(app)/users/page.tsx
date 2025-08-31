
import { prisma } from '@/lib/prisma';
import UsersClientPage from './client-page';
import { getFullSession } from '@/lib/session';

export default async function UsersPage() {
  const session = await getFullSession();
  
  const users = await prisma.user.findMany({
    where: {
      // Exclude developers from the list for non-developer users
      role: {
        not: 'DEVELOPER'
      }
    },
    orderBy: { role: 'asc' },
  });

  // The permissions need to be parsed from string to JSON before being passed to the client component
  const usersWithParsedPermissions = users.map(user => ({
      ...user,
      permissions: JSON.parse(user.permissions as string)
  }));

  return (
    <>
        <UsersClientPage users={usersWithParsedPermissions} />
    </>
  );
}
