const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const http = require('http')
const morgan = require('morgan')
const AWS = require('aws-sdk')


const app = express()

//middleware morgan bodyParser & cors
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())

//routes
//neo4j driver access location and key
// const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'test1234'))
// const session = driver.session()

app.get('/', function(req, res){
  res.send('Active Page53')
})

require('./routes/mainrouter')(app)

const port = 8082
app.listen(port, () => console.log('Server started on port 8082...'))
