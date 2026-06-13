import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          try {
            return await query(args);
          } catch (error: any) {
            if (error.code === 'P1017' || error.message?.includes('Server has closed the connection') || error.message?.includes('closed the connection')) {
              console.log(`[Prisma Retry] Retrying ${operation} on ${model} due to dropped Neon connection...`);
              await new Promise(resolve => setTimeout(resolve, 500)); 
              return await query(args);
            }
            throw error;
          }
        },
      },
    },
  }) as unknown as PrismaClient; 
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
  pingInterval: ReturnType<typeof setInterval>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Background Keep-Alive Ping (Runs every 3 minutes)
// This completely prevents the Neon Free Tier database from scaling to zero!
if (process.env.NODE_ENV === "development" && !globalThis.pingInterval) {
  globalThis.pingInterval = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[Keep-Alive] Pinged Neon database to prevent sleep mode.");
    } catch (e) {
      // Ignore background ping errors
    }
  }, 3 * 60 * 1000);
}

export { prisma };

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

