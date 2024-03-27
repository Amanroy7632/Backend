import dotenv from "dotenv"
import { app } from "./app.js";
import connectDB from "./db/index.js";
dotenv.config({
    path:"./.env"
})
connectDB()
.then(()=>{
    const port=process.env.PORT||3000;
   app.listen(port,()=>{
    console.log(`Server is runnnig on port ${port}`);
   })
})
.catch((err)=>{
  console.log(`Mongodb connection failed: ${err}`);
})







// first way to connect to database
/*
import express from "express";
;(async ()=>{
 try {
    const result= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    express.on("error",(error)=>{
        console.log("Something went wrong",error);
        throw error
    })
    express.listen(process.env.PORT,()=>{
        console.log(`Server is runnig on port ${process.env.PORT}`);
    })
 } catch (error) {
    
 }
})()
*/