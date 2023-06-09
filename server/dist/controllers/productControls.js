"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = exports.getSingleProduct = exports.deleteProduct = exports.getAllProducts = exports.createProduct = void 0;
// MODELS
const models_1 = require("../models");
// ARRAYS
const categoriesAndSubCategories_1 = require("../utilities/categories/categoriesAndSubCategories");
// HTTP CODES
const http_status_codes_1 = require("http-status-codes");
// ERRORS
const errors_1 = require("../errors");
// UTILITY FUNCTIONS
const controllers_1 = require("../utilities/controllers");
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // GET CLIENT SIDE BODY REQUEST TO CREATE A PRODUCT
    const { name, brand, price, tax, images, description, size, gender, category, subCategory, stock, } = req.body;
    const stockVal = Number(stock) || 0;
    // CHECK IF ALL NECESSARY CREDENTIALS ARE PROVIDED
    if (!name ||
        !brand ||
        !price ||
        !tax ||
        !images ||
        !description ||
        !size ||
        !gender ||
        !category ||
        !subCategory)
        throw new errors_1.BadRequestError("missing credentials");
    // DESCRIPTION ARRAY LENGTH CAN NOT BE MORE THAN 6
    if (description.length > 6)
        throw new errors_1.BadRequestError("max description list length for a product is 6");
    // ONE DESCRIPTION LENGTH ERROR
    for (let i = 0; i < description.length; i++) {
        if (description[i].length > 24)
            throw new errors_1.BadRequestError("a description can not be longer than 24 characters");
    }
    // CHECK IF CATEGORY MATCHES WITH THE SUB-CATEGORY
    if (!categoriesAndSubCategories_1.categoriesAndSubCategories[category].includes(subCategory))
        throw new errors_1.BadRequestError("sub-category does not match with the category");
    // CHECK IF THE PRODUCT WITH THE SAME NAME AND BRAND EXISTS
    const product = yield models_1.Product.findOne({ name, brand });
    if (product)
        throw new errors_1.UnauthorizedError("product already exists");
    // USER WHICH CREATED THE PRODUCT TO SELL
    const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    // CREATE A UNIQUE NEW PRODUCT
    const newProduct = yield models_1.Product.create({
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
        .status(http_status_codes_1.StatusCodes.CREATED)
        .json({ msg: "product created", product: newProduct });
});
exports.createProduct = createProduct;
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    // QUERY FROM THE CLIENT
    const { name, brand, color, size, price, isReview, isStock, rating, gender, page, seller, } = req.body;
    // EMPTY QUERY IN SERVER TO SET VALUES
    const query = {};
    if (name)
        query.name = (0, controllers_1.createMongooseRegex)(name);
    if (brand)
        query.brand = (0, controllers_1.createMongooseRegex)(brand);
    if (color)
        query.color = (0, controllers_1.createMongooseRegex)(color);
    if (size)
        query.size = size;
    if (price)
        query.price = (0, controllers_1.gteAndLteQueryForDb)(price);
    if (isReview)
        query.numberOfReviews = { $gt: 0 };
    if (isStock)
        query.stock = { $gt: 0 };
    if (rating)
        query.rating = Number(rating);
    if (gender)
        query.gender = gender;
    query.page = page ? page : 1;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id.toString();
    if (seller)
        query.seller = userId;
    // LIMIT AND SKIP VALUES
    console.log(query);
    const myLimit = 20;
    const { limit, skip } = (0, controllers_1.limitAndSkip)({ limit: myLimit, page: Number(page) });
    // FIND PRODUCTS
    const findProducts = models_1.Product.find(query);
    // LIMIT AND SKIP
    const result = yield findProducts.skip(skip).limit(limit);
    const length = result.length;
    res.status(http_status_codes_1.StatusCodes.OK).json({ result, length });
});
exports.getAllProducts = getAllProducts;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // GET PRODUCT ID FROM BODY
    const { id: productId } = req.params;
    // FIND PRODUCT
    const checkProduct = yield (0, controllers_1.findDocumentByIdAndModel)({
        id: productId,
        MyModel: models_1.Product,
    });
    // USER MUST BE LOGGED IN
    if (!req.user)
        throw new errors_1.UnauthorizedError("authorization denied");
    // CHECK IF SELLER AND PRODUCT SELLER MATCH
    const { userType, _id: reqUserId } = req.user;
    const sellerId = checkProduct.seller;
    (0, controllers_1.userIdAndModelUserIdMatchCheck)({ userType, userId: sellerId, reqUserId });
    // DELETE THE PRODUCT
    const product = yield models_1.Product.findOneAndDelete({ _id: productId });
    res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ msg: "product, related reviews and cart items are deleted" });
});
exports.deleteProduct = deleteProduct;
const getSingleProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // GET PRODUCT ID FROM BODY
    const { id: productId } = req.params;
    // FIND THE PRODUCT
    const product = yield (0, controllers_1.findDocumentByIdAndModel)({
        id: productId,
        MyModel: models_1.Product,
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({ product });
});
exports.getSingleProduct = getSingleProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // GET PRODUCT ID FROM BODY
    const { id: productId } = req.params;
    const { name, brand, price, images, description, size, gender, category, subCategory, stock, } = req.body;
    // FIND THE PRODUCT
    const product = yield (0, controllers_1.findDocumentByIdAndModel)({
        id: productId,
        MyModel: models_1.Product,
    });
    // UPDATE PROPERTIES
    if (name)
        product.name = name;
    if (brand)
        product.brand = brand;
    if (price)
        product.price = Number(price);
    if (images)
        product.images = images;
    if (description)
        product.description = description;
    if (size)
        product.size = size;
    if (gender)
        product.gender = gender;
    if (category)
        product.category = category;
    if (subCategory)
        product.subCategory = subCategory;
    if (stock)
        product.stock = stock;
    // SAVE UPDATED PRODUCT
    yield product.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({ msg: "product updated", product });
});
exports.updateProduct = updateProduct;
