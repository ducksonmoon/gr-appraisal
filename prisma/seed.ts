import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { sampleData } from '../data/sampleData';

async function main() {
  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? 'admin';
  const viewerPass = process.env.SEED_VIEWER_PASSWORD ?? 'viewer';
  const managerPass = process.env.SEED_MANAGER_PASSWORD ?? 'manager';
  const adminHash = bcrypt.hashSync(adminPass, 10);
  const viewerHash = bcrypt.hashSync(viewerPass, 10);
  const managerHash = bcrypt.hashSync(managerPass, 10);

  await prisma.user.upsert({
    where: { email: 'admin@localhost' },
    create: {
      email: 'admin@localhost',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    update: { passwordHash: adminHash, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'viewer@localhost' },
    create: {
      email: 'viewer@localhost',
      passwordHash: viewerHash,
      role: 'VIEWER',
    },
    update: { passwordHash: viewerHash, role: 'VIEWER' },
  });
  await prisma.user.upsert({
    where: { email: 'manager@localhost' },
    create: {
      email: 'manager@localhost',
      passwordHash: managerHash,
      role: 'MANAGER',
    },
    update: { passwordHash: managerHash, role: 'MANAGER' },
  });
  console.log(
    'Seeded users: admin@localhost, manager@localhost, viewer@localhost'
  );

  await prisma.evaluation.deleteMany({});
  await prisma.evaluation.createMany({
    data: sampleData.evaluations.map((e) => ({
      nationalId: e.nationalId,
      facultyName: e.facultyName,
      faculty: e.faculty,
      educationalScore: e.educationalScore,
      researchScore: e.researchScore,
      executiveScore: e.executiveScore,
      totalScore: e.totalScore,
      activitiesJson: e.activities ? JSON.stringify(e.activities) : null,
    })),
  });
  console.log('Seeded', sampleData.evaluations.length, 'evaluations');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
