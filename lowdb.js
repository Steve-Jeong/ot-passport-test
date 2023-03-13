import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'


// File path
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json')

// Configure lowdb to write to JSONFile
const adapter = new JSONFile(file)
const db = new Low(adapter)

// Read data from JSON file, this will set db.data content
await db.read()

// If db.json doesn't exist, db.data will be null
// Use the code below to set default data
// db.data = db.data || { posts: [] } // For Node < v15.x
db.data ||= { users: [] }             // For Node >= 15.x

// Create and query items using native JS API
// db.data.posts.push({name:'steve jeong', password:'1111'})
// const firstPost = db.data.posts[0]

// Alternatively, you can also use this syntax if you prefer
// const { posts } = db.data

// Finally write db.data content to file
await db.write()

const user = await db.data.users.find(user => user.email === 'jst0930@gmail.com')
if(user === undefined) {
  db.data.users.push(    {
    email:'jst0930@gmail.com',
    password:'x',
    name:'Steve Jeong'
  })
  await db.write()
}
// console.log('lowdb.posts : ', lowdb.data.users)


export {db as lowdb}