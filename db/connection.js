// Database connection and query helpers
import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Use global to prevent multiple instances during hot reload
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;

// Query helpers
export async function findMany(model, options = {}) {
  return prisma[model].findMany(options);
}

export async function findById(model, id) {
  return prisma[model].findUnique({ where: { id } });
}

export async function create(model, data) {
  return prisma[model].create({ data });
}

export async function update(model, id, data) {
  return prisma[model].update({ where: { id }, data });
}

export async function remove(model, id) {
  return prisma[model].delete({ where: { id } });
}

export async function paginate(model, options = {}) {
  const { page = 1, limit = 10, where = {}, orderBy = { id: 'desc' } } = options;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma[model].findMany({ skip, take: limit, where, orderBy }),
    prisma[model].count({ where })
  ]);
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}