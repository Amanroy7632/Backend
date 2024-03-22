import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app= express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"})) //use methods are used to configurations
app.use(express.urlencoded({extended:true,limit:"16kb"})) //use are also known as middleware
app.use(express.static("public")) //It creates a public assets directory
app.use(cookieParser())
export {app};