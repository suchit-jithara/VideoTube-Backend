import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    console.log("start")
    console.log(process.env.MONGODB_URI);
    const connectionObject = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("running")
    // if (connectionObject) {
    //   console.log("connectionObject :: ", connectionObject);
    //   console.log("connectionObject.connections :: ", connectionObject.connections);
    //   console.log("connectionObject.connection :: ", connectionObject.connection);
    // }
  }
  catch (error) {
    console.error("ERROR :: MongoDB Connecntion Error 😢 :: ", error);
    // process.exit(1); // if we use this process.exit then we exit code from where this code is as error. and code ferther not run 
    throw error; // but if we use this throw, it mean we handle exception and it throw error where it use, and if there exception handling code is return then this is also run.
  }
};

export default connectDB