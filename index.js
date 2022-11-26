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
    const usersCollection = client.db('bikeParadise').collection('users')

    app.get('/products', async(req,res) =>{
    const query = {};
    const products = await productCollection.find(query).toArray();
    res.send(products); 
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

    }
    finally{

    }
}
run().catch(console.log);

app.get('/', async(req,res)=>{
    res.send('Bike Paradise server is running');
})

app.listen(port, ()=> console.log(`Bike Paradise server is running on ${port}`))