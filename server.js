require('dotenv').config()
const app = require('./src/app')
const connectToDB = require('./src/config/db')
// why using require instead of import and export--already companies use this in production and it is more stable than import and export
// import and export is still in experimental stage and it is not yet supported by all the versions of node.js
// require and module.exports is the commonjs module system which is supported by all the versions of node.js

connectToDB()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
