// EXPRESS
import { RequestHandler } from "express";
// UTILITY FUNCTIONS
import {
  findDocumentByIdAndModel,
  userIdAndModelUserIdMatchCheck,
  limitAndSkip,
  getAllReviewsController,
} from "../utilities/controllers";
// MODELS
import { Review, Product, SingleOrder } from "../models";
// HTTP CODES
import { StatusCodes } from "http-status-codes";
// INTERFACES
import { ReviewSchemaInterface } from "../utilities/interfaces/models";
import { BadRequestError, UnauthorizedError } from "../errors";

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

  // CHECK IF THE USER ORDERED THIS PRODUCT BEFORE
  const singleOrder = await SingleOrder.findOne({
    user: req.user?._id,
    product: productId,
  });
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
  if (!req.user) throw new UnauthorizedError("authorization failed");
  const { userType, _id: reqUserId } = req.user;
  // FIND REVIEW FROM DB
  const review = await findDocumentByIdAndModel({
    id: reviewId,
    user: reqUserId,
    MyModel: Review,
  });
  // IF USER TYPE IS NOT ADMIN, THEN CHECK IF REQUIRED USER AND AUTHORIZED USER HAS THE SAME ID OR NOT. IF NOT SAME THROW AN ERROR
  userIdAndModelUserIdMatchCheck({
    userType,
    userId: review.user,
    reqUserId,
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
  if (!req.user) throw new UnauthorizedError("authorization failed");
  const { userType, _id: reqUserId } = req.user;
  // FIND THE REVIEW
  const review = await findDocumentByIdAndModel({
    id: reviewId,
    user: reqUserId,
    MyModel: Review,
  });
  // IF USER TYPE IS NOT ADMIN, THEN CHECK IF REQUIRED USER AND AUTHORIZED USER HAS THE SAME ID OR NOT. IF NOT SAME THROW AN ERROR
  userIdAndModelUserIdMatchCheck({
    userType,
    userId: review.user,
    reqUserId,
  });
  // UPDATE THE REVIEW DOCUMENT
  if (title) review.title = title;
  if (comment) review.comment = comment;
  if (rating) review.rating = rating;
  // SAVE THE REVIEW AFTER UPDATE
  await review.save();
  // SEND RES
  res.status(StatusCodes.OK).json({ msg: "review updated", result: review });
};

const getSingleReview: RequestHandler = async (req, res) => {
  // GET REVIEW ID
  const { id: reviewId } = req.params;
  // GET THE REVIEW
  const result = await findDocumentByIdAndModel({
    id: reviewId,
    MyModel: Review,
  });
  res.status(StatusCodes.OK).json({ msg: "review fetched", result });
};

const getAllReviews: RequestHandler = async (req, res) => {
  // GET REVIEW PAGE
  const {
    reviewPage,
    product: productId,
  }: {
    reviewPage: number;
    product: string;
  } = req.body;

  return getAllReviewsController({ reviewPage, productId, res });
};

const getMyAllReviews: RequestHandler = async (req, res) => {
  // GET REVIEW PAGE
  const {
    reviewPage,
    product: productId,
  }: {
    reviewPage: number;
    product: string;
  } = req.body;
  const userId = req.user?._id.toString();
  return getAllReviewsController({ userId, reviewPage, productId, res });
};
export {
  getAllReviews,
  getMyAllReviews,
  getSingleReview,
  createReview,
  deleteReview,
  updateReview,
};
