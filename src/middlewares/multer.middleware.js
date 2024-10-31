import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log(cb);
    // console.log("\n\n\n\ndestination :: ", file);
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    // console.log("\n\n\n\nfilename", file)
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage: storage })