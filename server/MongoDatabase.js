//const { KEYS } = require("../KEYS");
const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  userData: {
    type: Object,
    required: true
  },
  friends: {
    type: Object,
    required: true
  },
  profileViews: Number
}, { collection: 'users' });

const filmSchema = new mongoose.Schema({
  user: String,
  votes: Number,
  voters: {
    type: Object,
    required: true
  }, // fix why voters is not being saved when added
  filmLink: String,
  filmName: String,
  bio: String,
  totalTimeSpent: String,
  contributors: { type: [Object], default: [] }, // Default to an empty array
  comments: { type: [Object], default: [] } // Default to an empty array
}, { collection: 'filmData' });

mongoose.connect(process.env.DSN).then(() => console.log('Successfully Connected to Database')).catch(err => console.log('Error: ', err));
const User = mongoose.model('User', userSchema);
const Film = mongoose.model('Film', filmSchema);


async function addUserToDatabase(email, username, password) {
  const user = new User({ username, email, password, userData: {}, friends: {}, profileViews: 0 });
  await user.save();
}

async function getUserData(username) {
  return await User.findOne({ username }).lean();
}

async function getFilms() {
  return (await Film.find({}).lean());
}

async function addFilmToDB(user, filmLink, filmName, bio = "", totalTimeSpent = "", contributors) {
  const film = new Film({ user, votes: 0, voters: new Map(), filmLink, filmName, bio, totalTimeSpent, contributors, comments: [] });
  await film.save();
}

async function changeVotes(filmName, vote, user) {
  const film = await Film.findOne({ filmName });

  if (!film || !user) return;

  const currentVote = film.voters[user];
  if (currentVote === undefined) {
    film.voters[user] = vote;
    film.votes += (vote === 'up') ? 1 : -1;
  } else if (currentVote !== vote) {
    film.voters[user] = vote;
    film.votes += (vote === 'up') ? 2 : -2;
  }
  film.markModified('voters');
  await film.save();
}


async function getFilmByName(filmName) {
  return await Film.findOne({ filmName }).lean();
}

async function getFilmsByUsername(username) {
  return await Film.find({ user: username }).lean();
}

async function deleteFilm(username, filmName) {
  await Film.deleteOne({ user: username, filmName });
}

async function updateComments(filmName, comment, username, parentCommentId = null) {
  const film = await Film.findOne({ filmName });
  if (!film) return;

  const newComment = {
    text: comment,
    postedBy: username,
    commentedAt: new Date().toISOString()
  };

  if (parentCommentId) {
    const parentComment = film.comments.id(parentCommentId);
    if (parentComment) {
      parentComment.replies.push(newComment);
    }
  } else {
    film.comments.push(newComment);
  }

  await film.save();
}

async function getComments(filmName, skip = 0, limit = 10) {
  const film = await Film.findOne({ filmName }, 'comments').lean().skip(skip).limit(limit);
  return film ? film.comments : [];
}

async function deleteComment(filmName, commentId) {
  await Film.updateOne(
    { filmName },
    { $pull: { comments: { _id: commentId } } }
  );
}

async function addProfileView(username) {
  await User.updateOne({ username }, { $inc: { profileViews: 1 } });
}

async function checkIfUser(username) {
  const user = await User.findOne({ username }).lean();
  return !!user;
}

module.exports = {
  addUserToDatabase,
  getUserData,
  getFilms,
  addFilmToDB,
  getFilmByName,
  getFilmsByUsername,
  deleteFilm,
  updateComments,
  getComments,
  deleteComment,
  changeVotes,
  addProfileView,
  checkIfUser
};