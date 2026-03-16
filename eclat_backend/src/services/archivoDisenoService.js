const prisma = require("../prisma.js");

class ArchivoDisenoService {
  async getAll() {
    return await prisma.archivoDiseño.findMany();
  }

  async getById(id) {
    return await prisma.archivoDiseño.findUnique({
      where: { id_archivo: Number(id) },
    });
  }

  async create(data) {
    return await prisma.archivoDiseño.create({
      data: {
        id_diseño: data.id_diseño,
        tipo_archivo: data.tipo_archivo,
        ruta_archivo: data.ruta_archivo,
        formato: data.formato,
      },
    });
  }

  async delete(id) {
    return await prisma.archivoDiseño.delete({
      where: { id_archivo: Number(id) },
    });
  }
}

module.exports = new ArchivoDisenoService();
