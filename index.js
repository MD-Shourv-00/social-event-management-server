import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";

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
const joinedEvnet = db.collection("joined-event");

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
    dateObj: new Date(createdEventData.eventDate),
  });
  res.send(result);
});

//manage event get api
app.get("/all-event/:email", async (req, res) => {
  const email = req.params.email;
  const result = await allEvent
    .find({
      $and: [
        { email: { $eq: email } },
        { dateObj: { $gt: new Date() } },
      ],
    })
    .sort({ dateObj: 1 })
    .toArray();
  res.send(result);
});

//manage event patch api
app.patch("/all-event/:email", async (req, res) => {
  const email = req.params.email;
  const updatedEvent = req.body;
  updatedEvent.dateObj = new Date(updatedEvent.eventDate);
  const result = await allEvent.updateOne(
    { email: email },
    {
      $set: updatedEvent,
    },
  );
  res.send(result);
});

//manage event delete api
app.delete("/all-event/:email_id", async (req, res) => {
  const [email, id] = req.params.email_id.split("_");
  console.log(email, id);
  const result = await allEvent.deleteOne({
    $and: [
      {
        email: { $eq: email },
      },
      {
        _id: new ObjectId(id),
      },
    ],
  });
  res.send(result);
});

//upcoming event api
app.get("/all-future-event", async (req, res) => {
  const futureEvents = await allEvent
    .find({ dateObj: { $gte: new Date() } })
    .sort({ dateObj: 1 })
    .toArray();

  res.send(futureEvents);
});

//joined event post api
app.post("/joined-event/:email", async (req, res) => {
  const joinedEventData = req.body;
  const email = req.params.email;
  const result = await allEvent.insertOne({
    ...createdEventData,
    joinedUserEmail: email,
    joinedStatus: true,
  });
  res.send(result);
});

//joined event get api for join status check
app.get("/joined-event/:id", async (req, res) => {
  const id = req.params.id;
  const result = await joinedEvnet
    .find(
      { _id: new ObjectId(id) },
      { joinedStatus: 1, _id: 0 },
    )
    .toArray();
  res.send(result);
});

//joined event cancle join api
app.delete("/joined-event/:id", async (req, res) => {
  const id = req.params.id;
  const result = await joinedEvnet.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

//all joined event get api
app.get("/joined-event/:email", async (req, res) => {
  const email = req.params.email;
  const result = await joinedEvnet
    .find({ email: email })
    .sort({ dateObj: 1 })
    .toArray();
  res.send(result);
});

app.listen(port, () => {
  console.log(` app listening on port ${port}`);
});
