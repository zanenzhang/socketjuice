const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.Promise = global.Promise;
        mongoose.connect(process.env.MONGODB_SJ_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
    } catch (err) {
        console.error(err);
    }
}

module.exports = connectDB