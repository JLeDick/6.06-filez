import db from "#db/client";
import { faker } from "@faker-js/faker";

let folderCount = 3;
let filePerFolderCount = 5;

await db.connect();
await seed(folderCount, filePerFolderCount);
await db.end();
console.log("🌱 Database seeded.");

async function seed(folderCount, filePerFolderCount) {
  for (let i = 0; i < folderCount; i++) {
    const name = faker.music.genre();
    const {
      rows: [createdFolder],
    } = await db.query(
      `
      INSERT INTO folders (name)
      VALUES ($1)
      RETURNING *
      `,
      [name],
    );

    for (let j = 0; j < filePerFolderCount; j++) {
      const name = faker.music.songName();
      const size = faker.number.int({ min: 9, max: 105 });
      const {
        rows: [createdFile],
      } = await db.query(
        `
        INSERT INTO files (name, size, folder_id)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, size, createdFolder.id],
      );
    }
  }
}

/*
From the documentation it looks like, if I used Promise.all instead
of awaiting each one of the queries, then it would be faster because
all of the queries would run sequentially rather than individually,
but I don't really care for this project. Just writing this to remember.

Also, as far as I can tell I don't need to destructure the second db.query
because I don't do anything with the result. I'm going to remove it.
*/
