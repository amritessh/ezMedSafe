import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const loginSchema = Joi.object({
  apiKey: Joi.string().required()
});

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
}; 