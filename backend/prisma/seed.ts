import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar datos existentes
  await prisma.auditLog.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.clanHistory.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clan.deleteMany();

  // Crear clanes
  const clanAlfa = await prisma.clan.create({
    data: {
      name: 'Clan Alfa',
      tag: '[ALFA]',
      description: 'Unidad de élite especializada en operaciones tácticas'
    }
  });

  const clanBravo = await prisma.clan.create({
    data: {
      name: 'Clan Bravo',
      tag: '[BRAVO]',
      description: 'Unidad de reconocimiento y apoyo'
    }
  });

  const clanCharlie = await prisma.clan.create({
    data: {
      name: 'Clan Charlie',
      tag: '[CHARLIE]',
      description: 'Unidad aerotransportada'
    }
  });

  console.log('✅ Clanes creados');

  // Crear admin
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@arma.com',
      password: hashedPassword,
      nickname: 'AdminMaster',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      clanId: clanAlfa.id
    }
  });

  console.log('✅ Admin creado');
  console.log('   Email: admin@arma.com');
  console.log('   Password: Admin123!');

  // Crear líder de clan
  const hashedPasswordLeader = await bcrypt.hash('Leader123!', 10);
  
  const leader = await prisma.user.create({
    data: {
      email: 'leader@arma.com',
      password: hashedPasswordLeader,
      nickname: 'AlfaLeader',
      role: UserRole.CLAN_LEADER,
      status: UserStatus.ACTIVE,
      clanId: clanAlfa.id
    }
  });

  console.log('✅ Líder de clan creado');
  console.log('   Email: leader@arma.com');
  console.log('   Password: Leader123!');

  // Crear usuario normal
  const hashedPasswordUser = await bcrypt.hash('User123!', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'user@arma.com',
      password: hashedPasswordUser,
      nickname: 'SoldadoUno',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      clanId: clanBravo.id
    }
  });

  console.log('✅ Usuario normal creado');
  console.log('   Email: user@arma.com');
  console.log('   Password: User123!');

  console.log('\n🎉 Seed completado!');
}

main()
  .catch((e: Error) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });