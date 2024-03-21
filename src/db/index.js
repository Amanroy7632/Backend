import mongoose from "mongoose";
import { DB_NAME } from "../constraint.js";

const connectDB =async ()=>{
    try {
       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
       console.log(`Database connected !! Hosted: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(`FAILED to Connect with MongoDB: ${error}`);
        process.exit(1);
    }
}
export default connectDB