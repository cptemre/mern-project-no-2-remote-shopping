// MODEL
import { User, Token } from "../models";
// EXPRESS VARS
import { RequestHandler } from "express";
// HTTP CODES
import { StatusCodes } from "http-status-codes";
// BCRYPTJS
import bcrypt from "bcryptjs";
// ERRORS
import { ConflictError, UnauthorizedError, BadRequestError } from "../errors";
// SEND EMAIL
import { registerEmail, forgotPasswordEmail } from "../utilities/email";
// INTERFACES
import { ResetPasswordInterface } from "../utilities/interfaces/controllers";
// USER MODEL INTERFACE
import { UserSchemaInterface } from "../utilities/interfaces/models";
// JWT AND CRYPTO
import {
  attachJwtToCookie,
  createCrypto,
  createHash,
} from "../utilities/token";
// SPLIT CARD INFO
// * CREATE A NEW USER
const registerUser: RequestHandler = async (req, res) => {
  // BODY REQUESTS
  const {
    name,
    surname,
    email,
    password,
    phoneNumber,
    address,
    cardInfo,
    avatar,
    accountNo,
  }: UserSchemaInterface = req.body;
  // CHECK IF INFORMATION IS NOT MISSING CREDENTIALS
  if (!name && !surname && !email && !password)
    throw new BadRequestError("name, surname, email and password required");
  let userType = "";
  // CHECK IF USER EXISTS
  const user = await User.findOne({ email });

  // THROW ERROR IF USER EXISTS
  if (user) throw new ConflictError("user already exists");

  // IF THERE ARE NO USERS, FIRST ACCOUNT WILL BE AN ADMIN
  const isUsers = await User.find({}).countDocuments();

  // THERE CAN ONLY BE ONE ADMIN
  if (!isUsers) userType = "admin";
  else {
    if (userType === "admin") throw new BadRequestError("admin already exists");
    else userType = "user";
  }

  const verificationToken = createCrypto();

  // CREATE USER IF REQUIRED CREDENTIALS EXIST
  if (name && surname && email && password && userType) {
    const user = await User.create({
      name,
      surname,
      email,
      password,
      userType,
      phoneNumber,
      address,
      cardInfo,
      avatar,
      verificationToken,
      accountNo,
    });

    // await registerEmail(<RegisterVerificationInterface>{
    //   userEmail: user.email,
    //   userName: user.name,
    //   verificationToken: user.verificationToken,
    // });
    res
      .status(StatusCodes.CREATED)
      .json({ msg: "user created", verificationToken });
    // ! DELETE TOKEN FROM RES LATER
  } else throw new UnauthorizedError("invalid credentials");
};

const verifyEmail: RequestHandler = async (req, res) => {
  // GET TOKEN AND EMAIL FROM THE CLIENT
  const {
    verificationToken,
    email,
  }: { verificationToken: string; email: string } = req.body;
  // CHECK IF INFORMATION IS NOT MISSING EMAIL AND PASSWORD
  if (!verificationToken || !email)
    throw new BadRequestError("verificationToken and email required");
  // CHECK IF USER EXISTS IN OUR DB
  const user = await User.findOne({ email });
  if (!user) throw new UnauthorizedError("invalid credentials");
  // CHECK IF USER'S DB VERIFICATION TOKEN MATCHES WITH THE PROVIDED CLIENT VALUE
  if (user.verificationToken !== verificationToken || user.email !== email)
    throw new UnauthorizedError("invalid credentials");
  // UPDATE USER AND SAVE
  user.verificationToken = "";
  user.isVerified = true;
  user.verified = new Date(Date.now());
  await user.save();

  res.status(StatusCodes.OK).json({ msg: "user verified" });
};

const login: RequestHandler = async (req, res) => {
  // GET EMAIL AND PASSWORD VALUES FROM THE CLIENT
  const { email, password }: { email: string; password: string } = req.body;
  // CHECK IF INFORMATION IS NOT MISSING EMAIL AND PASSWORD
  if (!email || !password)
    throw new BadRequestError("email and password required");
  // FIND THE USER
  const user = await User.findOne({ email });
  // CHECK IF USER EXISTS
  if (!user) throw new UnauthorizedError("email is wrong");
  // COMPARE PASSWORDS
  const isPassword = await bcrypt.compare(password, user.password);

  if (!isPassword) throw new UnauthorizedError("password is wrong");
  // IF USER IS VERIFIED
  if (!user.isVerified) throw new UnauthorizedError("invalid credentials");

  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  // CHECK IF USER HAS A VALID TOKEN
  const existingToken = await Token.findOne({ user: user._id });
  // DELETE PASSWORD KEY TO NOT ATTACH IT TO TOKEN
  // * THIS CAN CREATE A PROBLEM. CHECK THIS IN THE FUTURE
  // HIDE USER PASSWORD BEFORE SENDING IT TO THE CLIENT
  user.password = "";
  if (existingToken) {
    if (!existingToken.isValid)
      throw new UnauthorizedError("invalid credentials");
    const refreshToken = existingToken.refreshToken;
    attachJwtToCookie({ res, user, refreshToken, ip, userAgent });
    res.status(StatusCodes.OK).json({ msg: "login success" });
    return;
  }
  // IF NOT CREATE NEW TOKENS
  // GET BROWSER AND IP INFORMATION
  // HASH ALL INFORMATION BEFORE STORING THEM TO DB
  const refreshToken = createCrypto();
  const hashedRefreshToken = await createHash(refreshToken);

  if (typeof userAgent !== "string")
    throw new UnauthorizedError("user agent is required");

  await Token.create({
    refreshToken: hashedRefreshToken,
    ip,
    userAgent,
    user: user._id,
  });
  attachJwtToCookie({
    res,
    user,
    refreshToken: hashedRefreshToken,
    ip,
    userAgent,
  });
  res.status(StatusCodes.OK).json({ msg: "login success" });
};

const logout: RequestHandler = async (req, res) => {
  res.cookie("access_token", "", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refresh_token", "", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "logout success" });
};

const forgotPassword: RequestHandler = async (req, res) => {
  // GET EMAIL ADDRESS FROM CLIENT
  const { email }: { email: string } = req.body;
  // CHECK IF INFORMATION IS NOT MISSING EMAIL
  if (!email) throw new BadRequestError("email required");
  // FIND THE USER IN DB
  const user = await User.findOne({ email });
  if (!user) throw new UnauthorizedError("email is wrong");
  // CREATE A TOKEN FOR THE CLIENT
  const passwordToken = createCrypto();
  // SEND THE EMAIL TO THE USER
  // await forgotPasswordEmail({
  //   userEmail: email,
  //   userName: user.name,
  //   verificationToken: passwordToken,
  // });
  // CREATE HASHED PASSWORD AND EXP DATE FOR 15 MINUTES
  const quarterHour = 1000 * 60 * 15;
  const hashedPasswordToken = await createHash(passwordToken);
  const passwordTokenExpDate = new Date(Date.now() + quarterHour);
  // SAVE THE USER WITH HASHED TOKEN AND EXP DATE
  user.passwordToken = hashedPasswordToken;
  user.passwordTokenExpDate = passwordTokenExpDate;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: "reset email sent", passwordToken });
};

const resetPassword: RequestHandler = async (req, res) => {
  // GET INFORMATION FROM CLIENT
  const { passwordToken, email, password }: ResetPasswordInterface = req.body;
  // CHECK IF INFORMATION IS NOT MISSING ANYTHING
  if (!passwordToken || !email || !password)
    throw new BadRequestError("passwordToken, email and password required");
  // CHECK IF USER EXISTS
  const user = await User.findOne({ email });
  if (!user) throw new UnauthorizedError("email is wrong");
  // COMPARE TOKEN VALIDATION
  const currentDate = new Date(Date.now());

  // COMPARE HASHED USER TOKEN AND REQUEST TOKEN AND EXP DATE
  const isPasswordToken = await bcrypt.compare(
    passwordToken,
    user.passwordToken
  );
  if (isPasswordToken || user.passwordTokenExpDate > currentDate) {
    user.password = password;
    user.passwordToken = "";
    user.passwordTokenExpDate = currentDate;

    await user.save();
    res.status(StatusCodes.OK).json({ msg: "reset success" });
  } else throw new UnauthorizedError("invalid credentials");
};

export {
  registerUser,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  logout,
};
