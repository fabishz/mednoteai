import { jest } from '@jest/globals';

const prismaMock = {
  template: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

jest.unstable_mockModule('../src/config/prisma.js', () => ({
  prisma: prismaMock
}));

const { TemplateService } = await import('../src/services/template.service.js');

describe('TemplateService', () => {
  beforeEach(() => {
    prismaMock.template.findMany.mockReset();
    prismaMock.template.create.mockReset();
    prismaMock.template.findFirst.mockReset();
    prismaMock.template.update.mockReset();
    prismaMock.template.delete.mockReset();
  });

  it('lists templates', async () => {
    prismaMock.template.findMany.mockResolvedValue([{ id: 't-1', name: 'SOAP', content: '...' }]);
    const result = await TemplateService.list();
    expect(result).toHaveLength(1);
    expect(prismaMock.template.findMany).toHaveBeenCalledTimes(1);
  });

  it('creates template', async () => {
    prismaMock.template.create.mockResolvedValue({ id: 't-1', name: 'SOAP', content: '...' });
    const result = await TemplateService.create({ name: 'SOAP', content: '...' });
    expect(result.id).toBe('t-1');
  });

  it('throws when updating missing template', async () => {
    prismaMock.template.findFirst.mockResolvedValue(null);
    await expect(TemplateService.update('missing', { name: 'X' })).rejects.toMatchObject({
      status: 404,
      code: 'TEMPLATE_NOT_FOUND'
    });
  });
});
