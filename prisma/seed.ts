/**
 * Database Seeder
 * מאכלס את מסד הנתונים בנתונים ראשוניים
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // יצירת חבילות
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { code: 'starter' },
      update: {
        priceCents: 0,
        featuresJson: {
          features: [
            '60 יום ניסיון חינם',
            'עד 3 עובדים',
            'סניף אחד',
            'עד 100 תורים בחודש',
            'התראות בסיסיות',
          ],
        },
      },
      create: {
        code: 'starter',
        name: 'Starter',
        maxBranches: 1,
        maxStaff: 3,
        monthlyAppointmentsCap: 100,
        priceCents: 0,
        featuresJson: {
          features: [
            '60 יום ניסיון חינם',
            'עד 3 עובדים',
            'סניף אחד',
            'עד 100 תורים בחודש',
            'התראות בסיסיות',
          ],
        },
      },
    }),
    prisma.package.upsert({
      where: { code: 'pro' },
      update: {
        priceCents: 9900,
        maxBranches: 1,
        maxStaff: 3,
        monthlyAppointmentsCap: 100,
        featuresJson: {
          features: [
            'עד 3 עובדים',
            'סניף אחד',
            'עד 100 תורים בחודש',
            'התראות מתקדמות',
            'אינטגרציות יומן',
            'דוחות ואנליטיקה',
          ],
        },
      },
      create: {
        code: 'pro',
        name: 'עסקים קטנים',
        maxBranches: 1,
        maxStaff: 3,
        monthlyAppointmentsCap: 100,
        priceCents: 9900,
        featuresJson: {
          features: [
            'עד 3 עובדים',
            'סניף אחד',
            'עד 100 תורים בחודש',
            'התראות מתקדמות',
            'אינטגרציות יומן',
            'דוחות ואנליטיקה',
          ],
        },
      },
    }),
    prisma.package.upsert({
      where: { code: 'ultra' },
      update: {
        priceCents: 19900,
        maxBranches: 5,
        maxStaff: 10,
        monthlyAppointmentsCap: 500,
        featuresJson: {
          features: [
            'עד 10 עובדים',
            'עד 5 סניפים',
            'עד 500 תורים בחודש',
            'כל התכונות של עסקים קטנים',
            'תמיכה מועדפת',
            'API מותאם אישית',
          ],
        },
      },
      create: {
        code: 'ultra',
        name: 'עסקים',
        maxBranches: 5,
        maxStaff: 10,
        monthlyAppointmentsCap: 500,
        priceCents: 19900,
        featuresJson: {
          features: [
            'עד 10 עובדים',
            'עד 5 סניפים',
            'עד 500 תורים בחודש',
            'כל התכונות של עסקים קטנים',
            'תמיכה מועדפת',
            'API מותאם אישית',
          ],
        },
      },
    }),
    prisma.package.upsert({
      where: { code: 'enterprise' },
      update: {
        priceCents: 49900,
        maxBranches: 999,
        maxStaff: 999,
        monthlyAppointmentsCap: 999999,
        featuresJson: {
          features: [
            'עובדים וסניפים ללא הגבלה',
            'תורים ללא הגבלה',
            'כל התכונות',
            'תמיכה 24/7',
            'מנהל חשבון ייעודי',
            'הדרכה והטמעה',
            'התאמות מיוחדות',
          ],
        },
      },
      create: {
        code: 'enterprise',
        name: 'אנלימיטד',
        maxBranches: 999,
        maxStaff: 999,
        monthlyAppointmentsCap: 999999,
        priceCents: 49900,
        featuresJson: {
          features: [
            'עובדים וסניפים ללא הגבלה',
            'תורים ללא הגבלה',
            'כל התכונות',
            'תמיכה 24/7',
            'מנהל חשבון ייעודי',
            'הדרכה והטמעה',
            'התאמות מיוחדות',
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${packages.length} packages`);

  // יצירת תבניות התראות ברירת מחדל
  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

