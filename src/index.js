console.log("Jay Bhagvan");

// her dotenv used to load environment variables from a .env file into process.env using the dotenv package
// import 'dotenv/config'
// This is a shortcut that immediately imports dotenv/config, which automatically calls dotenv.config() behind the scenes.
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDB from "./db/index.js";  
import app from "./app.js";

console.log(process.env.PORT)
const port = process.env.PORT || 3000;

const cdb = connectDB()
console.log(cdb);

cdb
  .then(() => {
    app.on('error', (error) => {
      console.log("ERROR after connection :: ", error);
      throw error;
    })

    app.listen(port, () => {
      console.log("App is listen at port :: ", port)
    })
  })
  .catch((error) => {
    console.log("ERROR :: ", error);
    process.exit(1);
  })