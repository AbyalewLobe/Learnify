import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function viewUsers() {
  try {
    console.log('📊 Fetching all users from database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Count by role
    const studentCount = users.filter((u) => u.role === 'STUDENT').length;
    const creatorCount = users.filter((u) => u.role === 'CREATOR').length;
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;

    console.log('📈 Summary:');
    console.log(`   Students: ${studentCount}`);
    console.log(`   Creators: ${creatorCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Total: ${users.length}`);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewUsers();
