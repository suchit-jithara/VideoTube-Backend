const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).then((data) => { console.log('.then', data) }).catch((err) => next(err))
  }
}

export { asyncHandler }
