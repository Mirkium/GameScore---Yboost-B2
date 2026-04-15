import type { RequestHandler } from "express";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate, type ValidationError } from "class-validator";
import { AppError, type ErrorDetails } from "../utils/app-error";

type ValidationSource = "body" | "query" | "params";

const flattenValidationErrors = (errors: ValidationError[]): ErrorDetails => {
  const details: Record<string, string[]> = {};

  const visit = (validationErrors: ValidationError[]): void => {
    for (const validationError of validationErrors) {
      if (validationError.constraints) {
        details[validationError.property] = Object.values(validationError.constraints);
      }

      const children = validationError.children ?? [];
      if (children.length > 0) {
        visit(children);
      }
    }
  };

  visit(errors);
  return details;
};

export const validateDto = <T extends object>(
  DtoClass: ClassConstructor<T>,
  source: ValidationSource = "body"
): RequestHandler => {
  return async (req, _res, next) => {
    try {
      const dto = plainToInstance(DtoClass, req[source], {
        enableImplicitConversion: true,
      });

      const validationErrors = await validate(dto as object, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (validationErrors.length > 0) {
        next(
          new AppError(400, "Validation failed", flattenValidationErrors(validationErrors))
        );
        return;
      }

      if (source === "body") {
        req.body = dto as never;
      } else {
        const target = req[source] as Record<string, unknown>;
        for (const key of Object.keys(target)) {
          delete target[key];
        }

        Object.assign(target, dto as Record<string, unknown>);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};