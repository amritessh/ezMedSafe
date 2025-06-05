import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Schemas for request body validation
export const loginSchema = z.object({
    apiKey: z.string().min(1, 'API Key cannot be empty'),
});

export const patientContextSchema = z.object({
    age_group: z.union([z.literal('Pediatric'), z.literal('Adult'), z.literal('Elderly')]).optional(),
    renal_status: z.boolean().optional(),
    hepatic_status: z.boolean().optional(),
    cardiac_status: z.boolean().optional(),
});

export const medicationInputSchema = z.object({
    name: z.string().min(1, 'Medication name cannot be empty'),
    rxNormId: z.string().optional(),
});

export const checkInteractionsSchema = z.object({
    patientContext: patientContextSchema,
    existingMedications: z.array(medicationInputSchema),
    newMedication: medicationInputSchema,
    patientProfileId: z.string().uuid().optional(), // UUID format for existing profile ID
});

// Generic validation middleware factory
export const validate = (schema: z.ZodObject<any, any>) =>
    (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        path: err.path.join('.'),
                        message: err.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };