const express = require('express')
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express()
const stripe = require('stripe')(process.env.Secret_KEY);
const port = process.env.PORT || 5000


// middleware
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(morgan('dev'))

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const verifyJWT = (req, res, next) =>{
  const authorization = req.headers.authorization
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'}) 
  }
  // bearer token
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({error: true, message: 'unauthorized access'}) 
    }
    req.decoded = decoded
    next()
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lgdhrpf.mongodb.net/?retryWrites=true&w=majority`

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
    // await client.connect();

    const usersCollection = client.db('hexaShop').collection('users')
    const productCollection = client.db('hexaShop').collection('products')
    const cartCollection = client.db('hexaShop').collection('carts')
    const reviewCollection = client.db('hexaShop').collection('reviews')
    const contactsCollection = client.db('hexaShop').collection('contacts')
    const paymentCollection = client.db('hexaShop').collection('payments')

    // jwt
    app.post('/jwt', (req, res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({token})
    })

    // use verifyJWT before using verifyAdmin
    const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = {email : email}
      const user = await usersCollection.findOne(query)
      if(user?.role !== 'admin'){
        return res.status(403).send({error: true, message: 'forbidden access'}) 
      }
      next()
    }


      // users related
      app.get('/users', verifyJWT, verifyAdmin, async(req, res)=>{
          const result = await usersCollection.find().toArray()
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


    // security layer verifyJWT
    // email same
    // check admin
    app.get('/users/admin/:email', verifyJWT, async(req, res)=>{
      const email = req.params.email
      if(req.decoded.email !== email){
        return res.send({admin: false})
      }
      const query = {email: email}
      const user = await usersCollection.findOne(query)
      const result = {admin : user?.role === 'admin'}
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
        const result = await productCollection.find().sort({_id: -1}).toArray()
        res.send(result)
    })


    // post product
    app.post('/products', verifyJWT, verifyAdmin, async(req, res)=>{
        const item = req.body
        const result = await productCollection.insertOne(item)
        res.send(result)
    })


    app.delete('/products/:id', verifyJWT, verifyAdmin, async(req, res)=>{
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const result = await productCollection.deleteOne(query)
    res.send(result) 
  })

     // get a single data of product
     app.get('/products/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await productCollection.findOne(query)
      res.send(result)
     })

     // pagination but i didn't add this in my UI
     app.get('/totalProducts', async(req, res)=>{
      const result = await productCollection.estimatedDocumentCount()
      res.send({totalProducts: result})
      })


     // cart collection
     app.post('/carts', async(req, res)=>{
      const item = req.body
      const result = await cartCollection.insertOne(item)
      res.send(result)
     })

     app.get('/carts', verifyJWT, async(req, res)=>{
      const email = req.query.email
      // console.log(email);
      if(!email){
        res.send([])
      }
     const decodedEmail = req.decoded.email
     if(email !== decodedEmail){
      return res.status(403).send({error: true, message: 'forbidden access'}) 
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

  //review collection
    app.get('/reviews', async(req, res)=>{
      const result = await reviewCollection.find().sort({_id: -1}).toArray()
      res.send(result)
    })

     // reviews collection
     app.post('/reviews', async(req, res)=>{
      const item = req.body
      const result = await reviewCollection.insertOne(item)
      res.send(result)
     })


    //contact message collection
    app.get('/contacts', async(req, res)=>{
      const result = await contactsCollection.find().sort({_id: -1}).toArray()
      res.send(result)
    })

     // contact collection
     app.post('/contacts', async(req, res)=>{
      const item = req.body
      const result = await contactsCollection.insertOne(item)
      res.send(result)
     })


  // create payment
  app.post("/create-payment-intent", verifyJWT, async (req, res) =>{
    const { price } = req.body;
    const amount = price*100

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: [ "card" ],
    })

    res.send({
      clientSecret: paymentIntent.client_secret
    });
  })


  // payment related api
  app.post('/payments', verifyJWT, async(req, res)=>{
    const payment = req.body
    const insertResult = await paymentCollection.insertOne(payment)


    const query = {_id: {$in: payment.cartItem.map(id => new ObjectId(id) )}}
    const deleteResult = await cartCollection.deleteMany(query)


    res.send({insertResult, deleteResult})
  })


  app.get('/admin-stats', verifyJWT, verifyAdmin, async (req, res)=>{
    const users = await usersCollection.estimatedDocumentCount()
    const products = await productCollection.estimatedDocumentCount()
    const orders = await paymentCollection.estimatedDocumentCount()


    const payments = await paymentCollection.find().toArray()
    const revenue = payments.reduce((sum, payment)=> sum + payment.price ,0)


    res.send({users, products, orders, revenue})
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