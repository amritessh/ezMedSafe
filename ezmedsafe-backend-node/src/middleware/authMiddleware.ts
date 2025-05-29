import { Request, Response, NextFunction } from 'express';
import prisma from '../clients/prismaClient';

declare global{
    namespace Express{
        interface Request{
            user?: {
                id: string;
            }
        }
    }
}



export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    if(!apiKey){
        return res.status(401).json({error: 'Unauthorized: API Key missing'});
    }

    try{
        const user = await prisma.user.findUnique({
            where: {
                apiKey: apiKey,
                select: {
                    id: true,
                },
            }
        });
        if(!user){
            console.warn(`Unauthorized: Invalid API Key Attempt: ${apiKey} from ${req.ip}`);
            return res.status(401).json({error: 'Unauthorized: Invalid API Key'});
        }
        req.user = {
            id: user.id
        };
        next();
    }catch(error){
        console.error('Error authenticating user:',error);
        return res.status(500).json({error: 'Internal Server Error during authentication'});
    }
}