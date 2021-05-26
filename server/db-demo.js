import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('webrtc.db');

db.serialize(() => {
  db.run('delete from rooms');

  const stmt = db.prepare('insert into rooms (name) values (?)');
  stmt.run('Svelte');
  stmt.run('React');
  stmt.finalize();

  db.each('select * from rooms', (err, row) => {
    console.log(row);
  });
});

db.close();
