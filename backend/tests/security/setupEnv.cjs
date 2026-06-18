const fs = require('fs')
const path = require('path')

const tokenFile = path.join(__dirname, '.auth-token.json')

if (fs.existsSync(tokenFile)) {
  global.__SECURITY_TEST_AUTH__ = JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
}
