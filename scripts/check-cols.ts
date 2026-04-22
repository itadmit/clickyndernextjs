import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const res = await p.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name FROM information_schema.columns 
    WHERE (table_name='customers' AND column_name='user_id')
       OR (table_name='businesses' AND column_name='cover_image_url')
       OR (table_name='business_gallery_images' AND column_name='id')
       OR (table_name='otp_codes' AND column_name='id')
       OR (table_name='business_invites' AND column_name='id')
       OR (table_name='customer_notifications' AND column_name='id')
    ORDER BY table_name;
  `;
  console.log('Found columns:');
  console.log(JSON.stringify(res, null, 2));
}

main().finally(() => p.$disconnect());
