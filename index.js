import express from 'express';
import cors from "cors"
import { MongoClient } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

// connect with mongodb 
const client = new MongoClient(
  process.env.MONGODB_CONNECTION_URI, // secure way
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectedClient = await connectToMongoDB();
const db = connectedClient.db('social-event');
const allEvent = db.collection('allEvent');


//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

//create event post api
app.post("/all-event", async(req, res) => {
    const createdEventData = req.body;
    const result = await allEvent.insertOne(createdEventData);
    res.send(result);
})



app.listen(port, () => {
  console.log(` app listening on port ${port}`);
});