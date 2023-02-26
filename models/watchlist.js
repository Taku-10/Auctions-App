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


// Implement the server-side logic to add and remove items from the watchlist:
// const express = require('express');
// const Watchlist = require('../models/Watchlist');

// const router = express.Router();

// router.post('/', async (req, res) => {
//   const { userId, itemId } = req.body;

//   try {
//     const watchlistItem = new Watchlist({ userId, itemId });
//     await watchlistItem.save();
//     res.status(201).send({ message: 'Item added to watchlist' });
//   } catch (error) {
//     res.status(400).send({ error: 'Failed to add item to watchlist' });
//   }
// });

// router.delete('/:id', async (req, res) => {
//   try {
//     const watchlistItem = await Watchlist.findByIdAndDelete(req.params.id);
//     if (!watchlistItem) {
//       return res.status(404).send({ error: 'Watchlist item not found' });
//     }
//     res.status(200).send({ message: 'Item removed from watchlist' });
//   } catch (error) {
//     res.status(400).send({ error: 'Failed to remove item from watchlist' });
//   }
// });

// module.exports = router;

// // Implement the client-side logic to add and remove items from the watchlist:
// import React, { useState, useEffect } from 'react';

// const Watchlist = () => {
//   const [watchlist, setWatchlist] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     setLoading(true);
//     fetch('/api/watchlist')
//       .then((res) => res.json())
//       .then((data) => {
//         setWatchlist(data);
//         setLoading(false);
//       });
//   }, []);

//   const handleAddToWatchlist = (itemId) => {
//     setLoading(true);
//     fetch('/api/watchlist', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ itemId }),
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         setWatch