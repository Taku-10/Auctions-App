const mongoose = require('mongoose');
const {Schema} = mongoose;

const watchlistSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },

});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
module.exports = Watchlist;

