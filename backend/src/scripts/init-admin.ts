/**
 * Script de inicialización: crea el usuario administrador por defecto
 * si no existe ningún admin en la base de datos.
 *
 * Se ejecuta automáticamente al arrancar la aplicación (ver entrypoint.sh).
 * Las credenciales se configuran mediante variables de entorno:
 *
 *   ADMIN_EMAIL     (por defecto: admin@arma.com)
 *   ADMIN_PASSWORD  (por defecto: Admin123!)
 *   ADMIN_NICKNAME  (por defecto: Admin)
 *
 * IMPORTANTE: Cambia estas variables en producción antes del primer arranque.
 */

import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function initAdmin(): Promise<void> {
  console.log('🔍 Comprobando si existe algún administrador...');

  const adminCount = await prisma.user.count({
    where: { role: UserRole.ADMIN },
  });

  if (adminCount > 0) {
    console.log(
      `✅ Ya existe${adminCount > 1 ? 'n' : ''} ${adminCount} administrador${adminCount > 1 ? 'es' : ''}. No se crea ninguno nuevo.`
    );
    return;
  }

  // Leer credenciales de las variables de entorno o usar valores por defecto
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@arma.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminNickname = process.env.ADMIN_NICKNAME || 'Admin';

  console.log('⚙️  No se encontró ningún administrador. Creando usuario admin por defecto...');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Nickname: ${adminNickname}`);

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email:    adminEmail,
      password: hashedPassword,
      nickname: adminNickname,
      role:     UserRole.ADMIN,
      status:   UserStatus.ACTIVE,
    },
  });

  console.log('');
  console.log('✅ Usuario administrador creado correctamente.');
  console.log('');
  console.log('⚠️  IMPORTANTE: Cambia la contraseña tras el primer acceso,');
  console.log('   o configura ADMIN_EMAIL y ADMIN_PASSWORD en tu .env antes de arrancar.');
  console.log('');
}

initAdmin()
  .catch((e: Error) => {
    console.error('❌ Error al inicializar el administrador:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });