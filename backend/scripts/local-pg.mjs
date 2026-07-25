import EmbeddedPostgres from 'embedded-postgres';

const pg = new EmbeddedPostgres({
  databaseDir: './.pgdata',
  user: 'psych',
  password: 'psych_pass',
  port: 5432,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

await pg.initialise();
await pg.start();
try {
  await pg.createDatabase('psychhub');
} catch (e) {
  console.log('createDatabase 跳过（可能已存在）:', e.message.split('\n')[0]);
}
console.log('LOCAL POSTGRES READY -> postgresql://psych:psych_pass@localhost:5432/psychhub');
