// EXPRESS
import { RequestHandler } from "express";
// UTILITY FUNCTIONS
import {
  findDocumentByIdAndModel,
  userIdAndModelUserIdMatchCheck,
  limitAndSkip,
} from "../utilities/controllers";
// MODELS
import { Review, Product, SingleOrder } from "../models";
// HTTP CODES
import { StatusCodes } from "http-status-codes";
// INTERFACES
import { ReviewSchemaInterface } from "../utilities/interfaces/models";
import { UnauthorizedError } from "../errors";

const createReview: RequestHandler = async (req, res) => {
  // REVIEW KEYS FROM THE CLIENT TO CREATE A NEW REVIEW
  const {
    title,
    comment,
    rating,
    productId,
  }: Omit<ReviewSchemaInterface, "user | product"> & { productId: string } =
    req.body;
  // USER ID
  const userId = req.user?._id;

  // FIND THE PRODUCT
  const product = await findDocumentByIdAndModel({
    id: productId,
    MyModel: Product,
  });

  // CHECK IF THE USER ORDERED THIS PRODUCT
  const singleOrder = await SingleOrder.findOne({ user: req.user?._id });
  if (!singleOrder)
    throw new UnauthorizedError("you did not purchase this item");

  // CREATE THE REVIEW
  const review = await Review.create({
    title,
    comment,
    rating,
    user: userId,
    product: productId,
  });

  res
    .status(StatusCodes.CREATED)
    .json({ msg: "review created", product, review });
};

const deleteReview: RequestHandler = async (req, res) => {
  // GET REVIEW ID
  const { id: reviewId } = req.params;
  // USER AUTH ID
  const userId: string = req.user?._id;
  // FIND REVIEW FROM DB
  const review = await findDocumentByIdAndModel({
    id: reviewId,
    user: userId,
    MyModel: Review,
  });
  // IF USER TYPE IS NOT ADMIN, THEN CHECK IF REQUIRED USER AND AUTHORIZED USER HAS THE SAME ID OR NOT. IF NOT SAME THROW AN ERROR
  if (req.user?._id)
    userIdAndModelUserIdMatchCheck({
      user: req.user,
      userId: review.user.toString(),
    });
  // DELETE REVIEW
  await Review.findOneAndDelete({ _id: reviewId });

  res.status(StatusCodes.OK).json({ msg: "review deleted" });
};

const updateReview: RequestHandler = async (req, res) => {
  // GET REVIEW ID
  const { id: reviewId } = req.params;
  // GET UPDATE VALUES FROM CLIENT BODY
  const {
    title,
    comment,
    rating,
  }: Omit<ReviewSchemaInterface, "user | product"> = req.body;
  // USER AUTH ID
  const userId: string = req.user?._id;
  // FIND THE REVIEW
  const review = await findDocumentByIdAndModel({
    id: reviewId,
    user: userId,
    MyModel: Review,
  });
  // IF USER TYPE IS NOT ADMIN, THEN CHECK IF REQUIRED USER AND AUTHORIZED USER HAS THE SAME ID OR NOT. IF NOT SAME THROW AN ERROR
  if (req.user?._id)
    userIdAndModelUserIdMatchCheck({
      user: req.user,
      userId: review.user.toString(),
    });
  // UPDATE THE REVIEW DOCUMENT
  if (title) review.title = title;
  if (comment) review.comment = comment;
  if (rating) review.rating = rating;
  // SAVE THE REVIEW AFTER UPDATE
  await review.save();
  // SEND RES
  res.status(StatusCodes.OK).json({ msg: "review updated", review });
};

const getSingleReview: RequestHandler = async (req, res) => {
  // GET REVIEW ID
  const { id: reviewId } = req.params;
  // GET IF YOU REQUIRE YOUR OWN REVIEWS
  const { myReview }: { myReview: string } = req.body;
  // USER AUTH ID
  const userId: string = myReview === "true" ? req.user?._id : null;
  // GET THE REVIEW
  const review = await findDocumentByIdAndModel({
    id: reviewId,
    user: userId,
    MyModel: Review,
  });
  res.status(StatusCodes.OK).json({ msg: "review fetched", review });
};

const getAllReviews: RequestHandler = async (req, res) => {
  // GET PRODUCT ID
  const { productId } = req.body;
  // GET REVIEW PAGE
  const { reviewPage, myReviews }: { reviewPage: number; myReviews: boolean } =
    req.body;
  // USER AUTH ID
  const userId: string = myReviews ? req.user?._id : null;
  // FIND THE REVIEW
  const product = await findDocumentByIdAndModel({
    id: productId,
    user: userId,
    MyModel: Product,
  });
  // FIND THE REVIEWS BY PRODUCT ID AND USER ID IF REQUIRED
  const query: { product: string; user?: string } = { product: "" };
  query.product = productId;
  if (myReviews) query.user = req.user?._id;
  // LIMIT AND SKIP VALUES
  const myLimit = 5;
  const { limit, skip } = limitAndSkip({ limit: myLimit, page: reviewPage });
  const result = Review.find(query);
  const reviews = await result.skip(skip).limit(limit);
  res.status(StatusCodes.OK).json({ msg: "reviews fetched", product, reviews });
};

export {
  getAllReviews,
  getSingleReview,
  createReview,
  deleteReview,
  updateReview,
};
