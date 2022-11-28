const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port =  process.env.PORT || 5000;
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());




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

    // app.get('/services/:id', async (req, res) => {
    //     const id = req.params.id;
    //     const query = { _id: ObjectId(id) };
    //     const service = await serviceCollection.findOne(query);
    //     res.send(service);
    // });

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

    // app.post('/users', async(req, res)=> {
    //     const user = req.body;
    //     console.log(user);
    //     const result = await usersCollection.insertOne(user);
    //     res.send(result);
    // });

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
        res.send({})
    });

    app.post('/products', async(req, res)=> {
            const product = req.body;
            console.log(product);
            const result = await productCollection.insertOne(product);
            res.send(result);
       
    });
    app.post('/bookings', async(req, res)=> {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
       
    });

    }
    finally{

    }
}
run().catch(console.log);

app.get('/', async(req,res)=>{
    res.send('Bike Paradise server is running');
})

app.listen(port, ()=> console.log(`Bike Paradise server is running on ${port}`))