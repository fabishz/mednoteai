import { prisma } from '../config/prisma.js';

function notFoundError() {
  return Object.assign(new Error('Template not found'), { status: 404, code: 'TEMPLATE_NOT_FOUND' });
}

export class TemplateService {
  static async list() {
    return prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async create({ name, content }) {
    return prisma.template.create({
      data: { name, content }
    });
  }

  static async update(id, { name, content }) {
    await this.getById(id);
    return prisma.template.update({
      where: { id },
      data: {
        ...(typeof name !== 'undefined' ? { name } : {}),
        ...(typeof content !== 'undefined' ? { content } : {})
      }
    });
  }

  static async delete(id) {
    await this.getById(id);
    await prisma.template.delete({ where: { id } });
  }

  static async getById(id) {
    const template = await prisma.template.findFirst({ where: { id } });
    if (!template) {
      throw notFoundError();
    }
    return template;
  }
}
