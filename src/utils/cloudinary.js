import { v2 as cloudinary } from "cloudinary";
import exp from "constants";
import fs from "fs" //used for handling a file system by default in node js
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        // upload our file to cloudinary 
       const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // printing a message on successfully uploaded file 
        console.log(`File is uploaded successfully to cloudinary:\n Path of file is: ${response.url}`);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)// it removes the locally saved temporary file as the upload operation got failed
        return null;
    }
}
// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });
export {uploadOnCloudinary};