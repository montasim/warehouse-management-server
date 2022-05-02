const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());

// verify jwt
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        req.decoded = decoded;
    });
    next();
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.twhxl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const testimonialsCollection = client.db('posDash').collection('testimonials');
        const productsCollection = client.db('posDash').collection('products');
        const myItemsCollection = client.db('posDash').collection('userItems');

        // testimonials
        app.get('/testimonials', async (req, res) => {
            const query = {};
            const cursor = testimonialsCollection.find(query);
            const testimonials = await cursor.toArray();

            res.send(testimonials);
        });

        // single testimonial
        app.get('/testimonials/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const testimonial = await testimonialsCollection.findOne(query);

            res.send(testimonial);
        });

        // all products
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();

            res.send(products);
        });

        // single product
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);

            res.send(product);
        });

        // add product
        app.post('/add-item', async (req, res) => {
            const newItem = req.body;
            console.log('added', newItem);
            const result = await productsCollection.insertOne(newItem);
            res.send(result);
        });

        // delete product
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);

            res.send(result);
        });

        // update product
        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const updateProduct = req?.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateStock = {
                $set: {
                    stock: updateProduct.stock
                }
            };
            const result = await productsCollection.updateOne(filter, updateStock, options)
            res.send(result);
        });

        // add user items
        app.post('/add-my-items', async (req, res) => {
            const newItem = req.body;
            console.log('added', newItem);
            const result = await myItemsCollection.insertOne(newItem);
            res.send(result);
        });

        // display user items
        app.get('/my-items', verifyJWT, async (req, res) => {
            const decodedUserEmail = req.decoded.userEmail;
            const userEmail = req.query.userEmail;

            if (userEmail === decodedUserEmail) {
                const query = { userEmail: userEmail };
                const cursor = myItemsCollection.find(query);
                const products = await cursor.toArray();

                res.send(products);
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' });
            }
        });

        // delete my items
        app.delete('/my-items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await myItemsCollection.deleteOne(query);

            res.send(result);
        });

        // JWT auth
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send(accessToken);
        });
    }
    finally {

    }
};

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running POSDash Server');
});

app.listen(port, () => {
    console.log('Listening to port', port);
});
