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
          res.send('Welcome to Collabeteria!')
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
    .run(`MATCH (p:Project {title: ${p.title}}) RETURN p`)
    .then((result) => {
      if (result.records[0] == null) {
        session.run(`CREATE (p:Project {title:${p.title}, vimeoLink:${p.vimeoLink}, genre:${p.genre}, image:${p.image}, info:${p.info}, tags:${p.tags}})`)
        .then(() => {
          res.send(`${p.title} is now on Collabeteria!`)
        })
      } else {
        res.send("This project already exists. Please choose a new title.")
      }
    })
    .catch((err) => {
      console.log(err)
    })
 });

 // Define roles and Project Owner for contributors to a Project
 // role requests need to be routed for approval before sent to the database
 // current build pushes through all requests except project owner
 app.put('/addrole',(req, res) => {
   const r = {
     user: `'${req.body.user}'`,
     project: `'${req.body.project}'`,
     projectOwner: `'${req.body.projectOwner}'`,
     role:`'${req.body.role}'`
   }
   session
    .run(`MATCH (p:Project {title: ${r.project}}) RETURN p`)
    .then((result) => {
      if (result.records[0] == null) {
      res.send("This project hasn't been created yet. Do you want to create it?")} else {
        session.run(`MATCH (p:Project {title: ${r.project}})<-[:CONTRIBUTES_TO {projectOwner: "yes"}]-(owner) RETURN owner`)
          .then((ownerCheck) => {
            let recordOwner = [];
            recordOwner.push(ownerCheck.records[0]);
            if(recordOwner[0] == null) {
              session.run(`MATCH (t:User {username:${r.user}}), (p:Project {title:${r.project}})
                    CREATE (t)-[:CONTRIBUTES_TO {projectOwner: "yes", role:${r.role}}]->(p)`)
              .then(() => {
                res.send("This is the first time this project is in Collabeteria, so you'll need to be the Project Owner")
              });
            } else {
              session.run(`MATCH (t:User {username:${r.user}}), (p:Project {title:${r.project}})
                    CREATE (t)-[:CONTRIBUTES_TO {role:${r.role}}]->(p)`)
              .then(() => {
                if(r.projectOwner == "'yes'") {
                    res.send("This project already has an owner. We sent them your role request and will let you know when it's approved.")
                } else {
                  res.send("We sent the Project Owner your role request and will let you know when it's approved.")
                };
              });
            }
          })
          .catch((err) => {
           console.log(err)
         })
      }
    })
 });

 // get request for all information for given username
 app.get('/profile',(req, res) => {
   const g = {
     user: `'${req.body.user}'`
   }
   session
    .run(`MATCH (t:User {username: ${g.user}}) - [r:CONTRIBUTES_TO]->(p) RETURN t.username, t.email, p.title, r.role`)
    .then((result) => {
      res.send(result.records[0]._fields)
    })
    .catch((err) => {
      console.log(err)
    })
 })

}
