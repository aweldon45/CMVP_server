const neo4jconfig = require('../../config/neo4jconfig.js')
const neo4j = require('neo4j-driver').v1
const driver = neo4j.driver(neo4jconfig.n4juri, neo4j.auth.basic(neo4jconfig.n4jlogin, neo4jconfig.n4jpassword))
const session = driver.session()

module.exports = (app) => {

// Add a user node to the Graph
  app.put('/newuser',(req, res) => {
    const t = {
      username: `'${req.body.username}'`,
      password: `'${req.body.password}'`,
      email: `'${req.body.email}'`,
      image:`'${req.body.image}'`,
      location:`'${req.body.location}'`,
    }
    session
      .run('MATCH (t:User) RETURN t')
      .then((allUsers) => {
        let recordsUsername = [];
        let recordsEmail = [];
        for (i=0; i<allUsers.records.length; i++) {
          recordsUsername.push(allUsers.records[i]._fields[0].properties.username);
          recordsEmail.push(allUsers.records[i]._fields[0].properties.email)
        };
        if (recordsUsername.includes(req.body.username)) {
          res.send(`${t.username} is already taken. Please pick a different username.`)
        } else if (recordsEmail.includes(req.body.email)) {
          res.send(`${t.email} already exists. Please login with your username and password`)
        } else {
        session.run(`CREATE (t:User {username:${t.username}, password:${t.password}, email:${t.email}, image:${t.image}, location:${t.location}})`)
        .then((result) => {
          res.send(result)
        })
      }})
      .catch((err) => {
        console.log(err)
      })
  });

 // Add a project node to the Graph
 app.put('/addproject',(req, res) => {
   const p = {
     title: `'${req.body.title}'`,
     vimeoLink: `'${req.body.vimeoLink}'`,
     genre: `'${req.body.genre}'`,
     image:`'${req.body.image}'`,
     info:`'${req.body.info}'`,
     tags:`'${req.body.tags}'`
   }
   session
     .run(`CREATE (p:Project {title:${p.title}, vimeoLink:${p.vimeoLink}, genre:${p.genre}, image:${p.image}, info:${p.info}, tags:${p.tags}})`)
     .then((result) => {
       res.send(result)
     })
     .catch((err) => {
       console.log(err)
     })
 });

 // Define roles for contributors to a Project
 app.put('/addrole',(req, res) => {
   const r = {
     user: `'${req.body.user}'`,
     project: `'${req.body.project}'`,
     projectOwner: `'${req.body.projectOwner}'`,
     role:`'${req.body.role}'`
   }
   session
      .run(`MATCH (p:Project {title: ${r.project}})<-[:CONTRIBUTES_TO {projectOwner: "yes"}]-(owner) RETURN owner`)
      .then((ownerCheck) => {
        let recordOwner = [];
        recordOwner.push(ownerCheck.records[0]);
        if(recordOwner[0] == null) {
          res.send("This project doesn't have an owner")
        } else {
          res.send("This project already has an owner")
        }
      })


     /*.run(`MATCH (t:User {username:${r.user}}), (p:Project {title:${r.project}})
           CREATE (t)-[:CONTRIBUTES_TO {projectOwner:${r.projectOwner}, role:${r.role}}]->(p)`)
     .then((result) => {
       res.send(result.records[0])
     })*/
     .catch((err) => {
       console.log(err)
     })
 });

}
