const constant = require('../config/const_credential');
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
exports.connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${constant.DB_URL}`);
        console.log(`Database connected successfully on ${conn.connection.host}`)
    } catch (error) {
        console.log("Database not connected", error);
    }
}
mongoose.set("strictQuery",true)