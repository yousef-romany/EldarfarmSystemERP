
import { prisma } from '@/lib/prisma';
import UsersClientPage from './client-page';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
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
