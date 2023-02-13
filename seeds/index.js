const mongoose = require("mongoose");
const Listing = require("../models/listing");
const{places,descriptors} = require("./seedHelpers");

mongoose.connect('mongodb://127.0.0.1:27017/Auctions')
    .then(()=> {
        console.log("Mongo Connection open");
    })
    .catch(err => {
        console.log("Mongo connection error");
        console.log(err);
    })


const sample = array => array[Math.floor(Math.random() * array.length)];
const conditions = ["New", "Refurbished", "Old"];
const names = ['Forest',
    'Ancient',
    'Petrified',
    'Roaring',
    'Cascade',
    'Tumbling',
    'Silent',
    'Redwood',
    'Bullfrog',
    'Maple',
    'Misty',
    'Elk',
    'Grizzly',
    'Ocean',
    'Sea',
    'Sky',
    'Dusty',
    'Diamond'
]

const seedDb = async() => {
    await Listing.deleteMany({});
    for (let i=0; i<17; i++) {
        const cond = Math.floor(Math.random() * 2);
        const rand = Math.floor(Math.random() * 17);
        const price = Math.floor(Math.random() * 20) +10
        const listing = new Listing({
            name: names[rand],
            description: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore pariatur similique amet iste non ad esse fuga, fugiat recusandae porro hic quo minima suscipit? Laborum culpa porro praesentium doloremque earum!",
            image: "https://source.unsplash.com/collection/483251",
            condition: conditions[cond],
            price: price
            
        });
        await listing.save();
    } 
}

seedDb().then(() => {
    mongoose.connection.close();
});