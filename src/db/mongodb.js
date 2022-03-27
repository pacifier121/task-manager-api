const mongoose = require('mongoose');

mongoose.connect(process.env.mongoDBurl, {
    useNewUrlParser: true,
})