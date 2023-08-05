const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000

// middleware
app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lgdhrpf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db('hexaShop').collection('users')
    const productCollection = client.db('hexaShop').collection('products')
    const cartCollection = client.db('hexaShop').collection('carts')

    // users related

    app.get('/users', async(req, res)=>{
      result = await usersCollection.find().toArray()
      res.send(result)
  })


    app.post('/users', async(req, res)=>{
      const user = req.body
      const query = {email: user.email}
      const exitUser = await usersCollection.findOne(query)
      console.log(exitUser);
      if(exitUser){
        return res.send({message: 'user already exits'})
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    app.patch('/users/admin/:id', async(req, res)=>{
      id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set:{
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete('/users/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      res.send(result) 
    })

    // get all data of product
    app.get('/products', async(req, res)=>{
        result = await productCollection.find().toArray()
        res.send(result)
    })

     // get a gingle data of product
     app.get('/products/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await productCollection.findOne(query)
      res.send(result)
     })


     // cart collection
     app.post('/carts', async(req, res)=>{
      const item = req.body
      const result = await cartCollection.insertOne(item)
      res.send(result)
     })

     app.get('/carts', async(req, res)=>{
      const email = req.query.email
      // console.log(email);
      if(!email){
        res.send([])
      }
     const query = { email: email}
     const result = await cartCollection.find(query).toArray()
     res.send(result)
  })

  app.delete('/carts/:id', async(req, res)=>{
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const result = await cartCollection.deleteOne(query)
    res.send(result) 
  })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send('Ecommerce site')
})

app.listen(port, ()=>{
    console.log(`ecommerce site ${port}`);
})