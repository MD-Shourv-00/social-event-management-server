import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = process.env.PORT || 5000;

//server api protection with jwt
async function verifyToken(req, res, next) {
  const jwtToken = req.headers.authorization;
  console.log(jwtToken);

  if (!jwtToken) {
    return res
      .status(404)
      .send({ massage: "no valid user" });
  }

  const token = jwtToken.split(" ")[1];

  if (!token) {
    return res
      .status(404)
      .send({ massage: "no valid user" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(
      `${process.env.NEXT_PUBLIC_lOCAL_CLIENT_URL}/api/auth/jwks`,
    ),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(404).send({
      massage: error.massage + " " + "no valid user",
    });
  }
}

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
const joinedEvent = db.collection("joinedEvent");

//middleware
app.use(cors());
app.use(express.json());

//create event post api
app.post(
  "/all-event/:email",
  verifyToken,
  async (req, res) => {
    const createdEventData = req.body;
    const email = req.params.email;
    const result = await allEvent.insertOne({
      ...createdEventData,
      email: email,
      dateObj: new Date(createdEventData.eventDate),
    });
    res.send(result);
  },
);

//manage event get api
app.get(
  "/all-event/:email",
  verifyToken,
  async (req, res) => {
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
  },
);

//manage event patch api
app.patch(
  "/all-event/:email/:id",
  verifyToken,
  async (req, res) => {
    const { email, id } = req.params;
    const updatedEvent = req.body;
    updatedEvent.dateObj = new Date(updatedEvent.eventDate);
    const result = await allEvent.updateOne(
      {
        $and: [{ email: email }, { _id: new ObjectId(id) }],
      },
      {
        $set: updatedEvent,
      },
      { upsert: true },
    );
    res.send(result);
  },
);

// and joined event patch by admin api
app.patch(
  "/joined-event-admin/:email/:id",
  verifyToken,
  async (req, res) => {
    const { email, id } = req.params;
    const updatedEvent = req.body;
    updatedEvent.dateObj = new Date(updatedEvent.eventDate);
    const result = await joinedEvent.updateMany(
      {
        email: email,
        eventId: new ObjectId(id),
      },
      {
        $set: updatedEvent,
      },
    );
    res.send(result);
  },
);

//joined event cancle by admin api
app.delete(
  "/joined-event-admin/:email/:eventId",
  verifyToken,
  async (req, res) => {
    const { email, eventId } = req.params;

    const result = await joinedEvent.deleteMany({
      email,
      eventId: new ObjectId(eventId),
    });

    res.send(result);
  },
);

//manage event delete api
app.delete(
  "/all-event/:email_id",
  verifyToken,
  async (req, res) => {
    const [email, id] = req.params.email_id.split("_");
    console.log(email, id);
    const result = await allEvent.deleteOne({
      email,
      _id: new ObjectId(id),
    });
    res.send(result);
  },
);

//upcoming event api
app.get("/all-future-event", async (req, res) => {
  const futureEvents = await allEvent
    .find({ dateObj: { $gte: new Date() } })
    .sort({ dateObj: 1 })
    .toArray();

  res.send(futureEvents);
});

//upcoming event for details page
app.get("/details-event/:id", async (req, res) => {
  const id = req.params.id;

  const futureEvent = await allEvent.findOne({
    _id: new ObjectId(id),
  });

  res.send(futureEvent);
});

//joined event post api
app.post(
  "/joined-event/:email",
  verifyToken,
  async (req, res) => {
    const email = req.params.email;
    const eventData = req.body;

    const { _id, ...eventInfo } = eventData;

    const result = await joinedEvent.insertOne({
      ...eventInfo,
      joinUserEmail: email,
      eventId: new ObjectId(_id),
    });
    res.send({ success: true });
  },
);

//joined event get api
app.get(
  "/joined-event/:email/:eventId",
  verifyToken,
  async (req, res) => {
    const { email, eventId } = req.params;

    const result = await joinedEvent.findOne({
      joinUserEmail: email,
      eventId: new ObjectId(eventId),
    });

    res.send({ joinStatus: !!result });
  },
);

//joined event cancle join api
app.delete(
  "/joined-event/:email/:eventId",
  verifyToken,
  async (req, res) => {
    const { email: joinUserEmail, eventId } = req.params;

    const result = await joinedEvent.deleteOne({
      joinUserEmail,
      eventId: new ObjectId(eventId),
    });

    res.send(result);
  },
);

//all joined event get api
app.get(
  "/joined-event/:email",
  verifyToken,
  async (req, res) => {
    const email = req.params.email;
    const result = await joinedEvent
      .find({ joinUserEmail: email })
      .sort({ dateObj: 1 })
      .toArray();
    res.send(result);
  },
);

app.listen(port, () => {
  console.log(` app listening on port ${port}`);
});

export default app;