const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =  process.env.PORT || 5000;
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next){
    // console.log('jwtToken',req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(401).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.eveocjd.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run(){
    try{
    const productCollection = client.db('bikeParadise').collection('products');
    const usersCollection = client.db('bikeParadise').collection('users');
    const categoryCollection = client.db('bikeParadise').collection('productCategories');
    const bookingCollection = client.db('bikeParadise').collection('bookings');


    app.get('/category/:id', async(req,res) =>{
        const id = req.params.id;
        const query = { categoryId: id };
        const selectedCategory = await categoryCollection.findOne(query);
        const productQuery = {category: selectedCategory.category};
        const products = await productCollection.find(productQuery).toArray();
        res.send(products);
    });

    app.get('/categories', async(req,res) =>{
    const query = {};
    const categories = await categoryCollection.find(query).toArray();
    res.send(categories); 
    });

    app.get('/jwt', async(req, res) =>{
        const email = req.query.email;
        const query = {email: email};
        const user = await usersCollection.findOne(query);
        if(user){
            const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '12h'})
            return res.send({accessToken: token})
        }
        res.status(401).send({accessToken: ''})
    });

    app.get('/users/role/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        res.send( user );
    })

    // app.post('/users', async(req, res)=> {
    //     const user = req.body;
    //     console.log(user);
    //     const result = await usersCollection.insertOne(user);
    //     res.send(result);
    // });
    app.get('/sellers', async(req,res) =>{
        const query = {role: 'Seller' };
        const sellers = await usersCollection.find(query).toArray();
        res.send(sellers); 
        });

    app.get('/buyers', async(req,res) =>{
        const query = {role: 'Buyer' };
        const buyers = await usersCollection.find(query).toArray();
        res.send(buyers); 
        });
    
    app.put('/sellers/verify/:id', verifyJWT, async(req,res) =>{
        const decodedEmail = req.decoded.email;
        const query = {email: decodedEmail};
        const user = await usersCollection.findOne(query);

        if(user?.role !== 'Admin'){
            return res.status(403).send({message: 'forbidden access'})
        }
        const id = req.params.id;
        const filter = { _id: ObjectId(id)};
        const option = {upsert: true}
        const updatedDoc = {
            $set: {
                status: 'verified'
            }
        }
        const result = await usersCollection.updateOne(filter, updatedDoc, option);
        res.send(result);
    });

    app.delete('/users/delete/:id', async(req, res) =>{
        // const decodedEmail = req.decoded.email;
        // const query = {email: decodedEmail};
        // const user = await usersCollection.findOne(query);

        // if(user?.role !== 'Admin'){
        //     return res.status(403).send({message: 'forbidden access'})
        // }
        const id = req.params.id;
        const filter = { _id: ObjectId(id)};
        const result = await usersCollection.deleteOne(filter);
        res.send(result);
    })
    

    app.post('/users', async(req, res)=> {
        const email = req.query.email;
        const query = {email: email};
        const queryUser = await usersCollection.findOne(query);
        if(!queryUser){
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        }
        return
    });

    app.get('/products', verifyJWT, async(req, res)=> {
        const decodedEmail = req.decoded.email;
        const email = req.query.email;
        if(email !== decodedEmail){
            return res.status(403).send({message:'forbidden access'})
        }
        const query = {sellerEmail: email};
        const products = await productCollection.find(query).toArray();
        res.send(products);
    })

    app.post('/products', async(req, res)=> {
            const product = req.body;
            console.log(product);
            const result = await productCollection.insertOne(product);
            res.send(result);
       
    });

    app.delete('/products/delete/:id', async(req, res) =>{
       
        const id = req.params.id;
        const filter = { _id: ObjectId(id)};
        const result = await productCollection.deleteOne(filter);
        console.log(result);
        res.send(result);
    })

    app.get('/bookings', verifyJWT, async(req, res)=> {
        const decodedEmail = req.decoded.email;
        const email = req.query.email;
        if(email !== decodedEmail){
            return res.status(403).send({message:'forbidden access'})
        }
        const query = {email: email};
        const bookings = await bookingCollection.find(query).toArray();
        res.send(bookings);
    })

    app.post('/bookings', async(req, res)=> {
        const email = req.query.email;
        const query = {email: email};
        const queryUser = await usersCollection.findOne(query);
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
       
    });

    app.delete('/bookings/delete/:id', async(req, res) =>{
       
        const id = req.params.id;
        const filter = { _id: ObjectId(id)};
        const result = await bookingCollection.deleteOne(filter);
        console.log(result);
        res.send(result);
    })


    }
    finally{

    }
}
run().catch(console.log);

app.get('/', async(req,res)=>{
    res.send('Bike Paradise server is running');
})

app.listen(port, ()=> console.log(`Bike Paradise server is running on ${port}`))