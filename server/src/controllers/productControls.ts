// MODELS
import { Product, Review, User } from "../models";
// EXPRESS
import { RequestHandler } from "express";
// INTERFACES
import {
  GetAllProductsQueryInterface,
  GetAllProductsReqBodyInterface,
} from "../utilities/interfaces/controllers";
// MODEL INTERFACES
import {
  ProductSchemaInterface,
  UserSchemaInterface,
} from "../utilities/interfaces/models";
// ARRAYS
import { categoriesAndSubCategories } from "../utilities/categories/categoriesAndSubCategories";
// HTTP CODES
import { StatusCodes } from "http-status-codes";
// ERRORS
import { BadRequestError, UnauthorizedError } from "../errors";
// UTILITY FUNCTIONS
import {
  findDocumentByIdAndModel,
  gteAndLteQueryForDb,
  limitAndSkip,
  userIdAndModelUserIdMatchCheck,
  createMongooseRegex,
} from "../utilities/controllers";

const createProduct: RequestHandler = async (req, res) => {
  // GET CLIENT SIDE BODY REQUEST TO CREATE A PRODUCT
  const {
    name,
    brand,
    price,
    tax,
    images,
    description,
    size,
    gender,
    category,
    subCategory,
    stock,
  }: Omit<ProductSchemaInterface, "numberOfReviews | averateRating | stock"> =
    req.body;
  const stockVal = Number(stock) || 0;
  // CHECK IF ALL NECESSARY CREDENTIALS ARE PROVIDED
  if (
    !name ||
    !brand ||
    !price ||
    !tax ||
    !images ||
    !description ||
    !size ||
    !gender ||
    !category ||
    !subCategory
  )
    throw new BadRequestError("missing credentials");

  // DESCRIPTION ARRAY LENGTH CAN NOT BE MORE THAN 6
  if (description.length > 6)
    throw new BadRequestError("max description list length for a product is 6");
  // ONE DESCRIPTION LENGTH ERROR
  for (let i = 0; i < description.length; i++) {
    if (description[i].length > 24)
      throw new BadRequestError(
        "a description can not be longer than 24 characters"
      );
  }
  // CHECK IF CATEGORY MATCHES WITH THE SUB-CATEGORY
  if (!categoriesAndSubCategories[category].includes(subCategory))
    throw new BadRequestError("sub-category does not match with the category");

  // CHECK IF THE PRODUCT WITH THE SAME NAME AND BRAND EXISTS
  const product = await Product.findOne({ name, brand });
  if (product) throw new UnauthorizedError("product already exists");

  // USER WHICH CREATED THE PRODUCT TO SELL
  const sellerId = req.user?._id;
  // CREATE A UNIQUE NEW PRODUCT
  const newProduct = await Product.create({
    name,
    brand,
    price,
    tax,
    images,
    description,
    size,
    gender,
    category,
    subCategory,
    stock: stockVal,
    seller: sellerId,
  });
  res
    .status(StatusCodes.CREATED)
    .json({ msg: "product created", product: newProduct });
};

const getAllProducts: RequestHandler = async (req, res) => {
  // QUERY FROM THE CLIENT
  const {
    name,
    brand,
    color,
    size,
    price,
    isReview,
    isStock,
    rating,
    gender,
    page,
    seller,
  }: Partial<GetAllProductsReqBodyInterface> = req.body;

  // EMPTY QUERY IN SERVER TO SET VALUES
  const query: Partial<GetAllProductsQueryInterface> = {};
  if (name) query.name = createMongooseRegex(name);
  if (brand) query.brand = createMongooseRegex(brand);
  if (color) query.color = createMongooseRegex(color);
  if (size) query.size = size;
  if (price) query.price = gteAndLteQueryForDb(price);
  if (isReview) query.numberOfReviews = { $gt: 0 };
  if (isStock) query.stock = { $gt: 0 };
  if (rating) query.rating = Number(rating);
  if (gender) query.gender = gender;
  query.page = page ? page : 1;
  const userId = req.user?._id.toString();
  if (seller) query.seller = userId;
  // LIMIT AND SKIP VALUES
  console.log(query);

  const myLimit = 20;
  const { limit, skip } = limitAndSkip({ limit: myLimit, page: Number(page) });
  // FIND PRODUCTS
  const findProducts = Product.find(query);
  // LIMIT AND SKIP
  const result = await findProducts.skip(skip).limit(limit);
  const length = result.length;
  res.status(StatusCodes.OK).json({ result, length });
};

const deleteProduct: RequestHandler = async (req, res) => {
  // GET PRODUCT ID FROM BODY
  const { id: productId } = req.params;
  // FIND PRODUCT
  const checkProduct = await findDocumentByIdAndModel({
    id: productId,
    MyModel: Product,
  });
  // USER MUST BE LOGGED IN
  if (!req.user) throw new UnauthorizedError("authorization denied");
  // CHECK IF SELLER AND PRODUCT SELLER MATCH
  const { userType, _id: reqUserId } = req.user;
  const sellerId = checkProduct.seller;
  userIdAndModelUserIdMatchCheck({ userType, userId: sellerId, reqUserId });

  // DELETE THE PRODUCT
  const product = await Product.findOneAndDelete({ _id: productId });

  res
    .status(StatusCodes.OK)
    .json({ msg: "product, related reviews and cart items are deleted" });
};

const getSingleProduct: RequestHandler = async (req, res) => {
  // GET PRODUCT ID FROM BODY
  const { id: productId } = req.params;
  // FIND THE PRODUCT
  const product = await findDocumentByIdAndModel({
    id: productId,
    MyModel: Product,
  });

  res.status(StatusCodes.OK).json({ product });
};

const updateProduct: RequestHandler = async (req, res) => {
  // GET PRODUCT ID FROM BODY
  const { id: productId } = req.params;
  const {
    name,
    brand,
    price,
    images,
    description,
    size,
    gender,
    category,
    subCategory,
    stock,
  }: Omit<ProductSchemaInterface, "numberOfReviews | averageRating"> = req.body;
  // FIND THE PRODUCT
  const product = await findDocumentByIdAndModel({
    id: productId,
    MyModel: Product,
  });
  // UPDATE PROPERTIES
  if (name) product.name = name;
  if (brand) product.brand = brand;
  if (price) product.price = Number(price);
  if (images) product.images = images;
  if (description) product.description = description;
  if (size) product.size = size;
  if (gender) product.gender = gender;
  if (category) product.category = category;
  if (subCategory) product.subCategory = subCategory;
  if (stock) product.stock = stock;
  // SAVE UPDATED PRODUCT
  await product.save();

  res.status(StatusCodes.OK).json({ msg: "product updated", product });
};

export {
  createProduct,
  getAllProducts,
  deleteProduct,
  getSingleProduct,
  updateProduct,
};
