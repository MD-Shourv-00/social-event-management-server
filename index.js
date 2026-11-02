import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import "dotenv/config"

const app = express();
const port = process.env.PORT || 5000;



// connect with mongodb
const client = new MongoClient(
  process.env.MONGODB_CONNECTION_URI,
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
const db = connectedClient?.db("social-event");
const allEvent = db.collection("allEvent");

//middleware
app.use(cors());
app.use(express.json());

//create event post api
app.post("/all-event/:email", async (req, res) => {
  const createdEventData = req.body;
  const email = req.params.email;
  const result = await allEvent.insertOne({
    ...createdEventData,
    email: email,
  });
  res.send(result);
});

//manage event get api
app.get("/all-event/:email", (req, res) => {
  const email = req.params.email;
  const result = allEvent.find({ email: { $eq: email } }).sort({eventDate: -1});
  res.send(result);
});

//manage event patch api
app.patch("/all-event/:email", async (req, res) => {
  const email = req.params.email;
  const updatedEvent = req.body;
  const result = await allEvent.updateOne(
    { email: email },
    {
      $set: {
        ...updatedEvent,
      },
    },
  );
  res.send(result);
});

//manage event delete api
app.delete("/all-event/:email", async (req, res) => {
     const email = req.params.email;
     const result = await allEvent.deleteOne({
       email: { $eq: email },
     });
     res.send(result);
})

//upcoming event api


app.listen(port, () => {
  console.log(` app listening on port ${port}`);
});
