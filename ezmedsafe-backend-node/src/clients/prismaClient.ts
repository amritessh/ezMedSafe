import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectPrisma(){
    try{
        await prisma.$connect();
        console.log('Connected to Prisma');
    }catch(error){
        console.error('Error connecting to Prisma:',error);
        process.exit(1);
    }
}

connectPrisma();

export default prisma;