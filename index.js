const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const myID = "mongodb+srv://jyotsnaj:4man!R$4ZbkEqDk@test-pro-db.hmzqj94.mongodb.net/?retryWrites=true&w=majority&appName=test-pro-db";
mongoose.connect(myID, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log("Server is running");
});

const UserSchema = new Schema({
  username: String,
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now
  },
});

const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.post("/api/users", async (req, res) => {
  console.log(req.body);
  const userObj = new User({
    username: req.body.username
  });
  try {
    const user = await userObj.save();
    console.log(user);
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // If no date is provided, use the current date
  const exerciseDate = date ? new Date(date) : new Date();

  const exerciseObj = new Exercise({
    user_id: userId,
    description,
    duration,
    date: exerciseDate
  });

  try {
    const exercise = await exerciseObj.save();
    console.log(exercise);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: userId,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to save exercise' });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let dateFilter = {};
    if (from) {
      dateFilter.$gte = new Date(from);
    }
    if (to) {
      dateFilter.$lte = new Date(to);
    }

    let filter = { user_id: userId };
    if (Object.keys(dateFilter).length) {
      filter.date = dateFilter;
    }

    let query = Exercise.find(filter).select('description duration date');
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const exercises = await query.exec();

    res.json({
      _id: userId,
      username: user.username,
      count: exercises.length,
      log: exercises.map(e => ({
        description: e.description,
        duration: e.duration,
        date: e.date.toDateString()
      }))
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
