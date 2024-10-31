const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).then((data) => {
      // console.log('👍🏻 :: ', data) 
    }).catch((err) => {
      next(err);
    })
  }
}

export { asyncHandler }
