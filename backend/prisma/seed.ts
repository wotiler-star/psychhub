import { createPrismaClient } from './prisma-extensions';
import * as bcrypt from 'bcryptjs';
import { resources, helplines, assessments, articles, counselors, reviews } from './seed-data';

const prisma = createPrismaClient();

/**
 * SQLite 兼容层放宽输入类型。
 * schema.prisma 里 tags/specialties/approach/languages/questions/interpretation 声明为 String
 * （SQLite 连接器不支持标量数组与 Json），而种子数据里它们是数组 / 对象——
 * 运行时由 prisma-extensions 的 $allOperations 扩展在写入前自动序列化，行为正确；
 * 但 Prisma 生成的静态类型仍按 String 校验，故此处显式放宽，避免 nest build 编译失败。
 */
const dbInput = <T>(v: T): any => v;

async function main() {
  console.log('开始写入种子数据...');
  for (const r of resources) {
    const { featured, ...rest } = r;
    const data = dbInput({ ...rest, type: rest.type, featured: !!featured });
    await prisma.resource.upsert({
      where: { name: r.name },
      update: data,
      create: data,
    });
  }
  for (const h of helplines) {
    await prisma.helpline.upsert({
      where: { name: h.name },
      update: dbInput(h),
      create: dbInput(h),
    });
  }
  for (const a of assessments) {
    await prisma.assessment.upsert({
      where: { slug: a.slug },
      update: dbInput(a),
      create: dbInput(a),
    });
  }
  for (const art of articles) {
    const { publishedAt, ...rest } = art;
    const pub = new Date(publishedAt);
    await prisma.article.upsert({
      where: { slug: art.slug },
      update: dbInput({ ...rest, publishedAt: pub }),
      create: dbInput({ ...rest, publishedAt: pub }),
    });
  }
  for (const c of counselors) {
    await prisma.counselor.upsert({
      where: { name: c.name },
      update: dbInput(c),
      create: dbInput(c),
    });
  }
  for (const rv of reviews) {
    const { createdAt, ...rest } = rv;
    const cDate = new Date(createdAt);
    await prisma.review.upsert({
      where: { id: rv.id },
      update: dbInput({ ...rest, createdAt: cDate }),
      create: dbInput({ ...rest, createdAt: cDate }),
    });
  }

  // 演示账号（生产请改为环境变量注入的初始账号，密码以 bcrypt 哈希持久化）
  const DEMO_EMAIL = 'demo@psychhub.cn';
  const DEMO_NAME = '演示用户';
  const DEMO_PWD = 'demo1234';
  const demoHash = await bcrypt.hash(DEMO_PWD, 10);
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: DEMO_NAME, passwordHash: demoHash },
    create: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash: demoHash },
  });

  const [rc, hc, ac, ac2, cc, rc2, uc] = await Promise.all([
    prisma.resource.count(),
    prisma.helpline.count(),
    prisma.assessment.count(),
    prisma.article.count(),
    prisma.counselor.count(),
    prisma.review.count(),
    prisma.user.count(),
  ]);
  console.log(
    `种子完成：资源 ${rc} 条，求助 ${hc} 条，测评 ${ac} 个，资讯 ${ac2} 篇，咨询师 ${cc} 位，评价 ${rc2} 条，用户 ${uc} 位（演示账号 ${DEMO_EMAIL} / ${DEMO_PWD}）`,
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
