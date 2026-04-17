#!/usr/bin/env node

/**
 * סקריפט ליצירת משתמש Super Admin
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'itadmit@gmail.com';
  const name = 'IT Admin';
  const phone = '0500000000'; // טלפון דמה
  const password = 'Admin123!'; // סיסמה זמנית - צריך לשנות!

  try {
    console.log('🔐 יוצר משתמש Super Admin...');
    
    // בדיקה אם המשתמש כבר קיים
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log('⚠️  משתמש כבר קיים. מעדכן הרשאות...');
      await prisma.user.update({
        where: { email },
        data: { isSuperAdmin: true }
      });
      console.log('✅ הרשאות עודכנו!');
      return;
    }

    // יצירת hash לסיסמה
    const passwordHash = await bcrypt.hash(password, 10);

    // יצירת המשתמש
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        name,
        phone,
        passwordHash,
        isSuperAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ משתמש Super Admin נוצר בהצלחה!');
    console.log('');
    console.log('📧 אימייל:', email);
    console.log('🔑 סיסמה:', password);
    console.log('');
    console.log('⚠️  חשוב! שנה את הסיסמה מיד אחרי ההתחברות!');
    console.log('');
    console.log('🔗 התחבר ב: https://clickynder.com/auth/signin');
    console.log('🔗 גישה לאדמין: https://clickynder.com/admin');

  } catch (error) {
    console.error('❌ שגיאה ביצירת המשתמש:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

