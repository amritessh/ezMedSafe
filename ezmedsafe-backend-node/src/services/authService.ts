import prisma from '../clients/prismaClient';

export class AuthService {
    async verifyApiKey(apiKey: string): Promise<string|null> {
        const user = await prisma.user.findUnique({
            where: { apiKey: apiKey },
            select: { id: true },
        });
        return user?.id || null;
    }
}