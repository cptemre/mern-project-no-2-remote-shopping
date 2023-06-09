import CustomError from "./CustomError";
import { StatusCodes } from "http-status-codes";
class UnauthorizedError extends CustomError {
  statusCode = StatusCodes.UNAUTHORIZED;
  public constructor(public message: string) {
    super(message);
  }
}

export default UnauthorizedError;
