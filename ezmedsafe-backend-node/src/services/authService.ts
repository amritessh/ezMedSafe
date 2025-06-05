import prisma from '../clients/prismaClient';

export class AuthService {
    async verifyApiKey(apiKey: string): Promise<string|null> {
        const user = await prisma.user.findUnique({
            where: { apiKey: apiKey },
            select: { id: true },
        });
        return user?.id || null;
    }

    async createUser(apiKey: string) {
        // Check if API Key already exists
        const existingUser = await prisma.user.findUnique({
            where: { apiKey: apiKey },
        });
        if (existingUser) {
            throw new Error('API Key already exists');
        }

        return prisma.user.create({
            data: {
                apiKey: apiKey,
            },
        });
    }
}