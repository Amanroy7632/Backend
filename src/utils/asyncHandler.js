const asyncHandler=(requestHandler)=>{
  (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
  }
}
export {asyncHandler}

// const requestHandler = async (requestFunction)=>{
//     try {
//         await requestFunction(req,res,next);
//     } catch (error) {
//         next(error.code)
//     }
// }