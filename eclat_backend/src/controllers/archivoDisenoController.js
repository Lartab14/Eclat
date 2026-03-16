const archivoDisenoService = require("../services/archivoDisenoService.js");

class ArchivoDisenoController {
  async getAll(req, res) {
    try {
      const archivos = await archivoDisenoService.getAll();
      res.json(archivos);
    } catch (error) {
      res.status(500).json({ error: "Error obteniendo los archivos" });
    }
  }

  async getById(req, res) {
    try {
      const archivo = await archivoDisenoService.getById(req.params.id);
      res.json(archivo);
    } catch (error) {
      res.status(404).json({ error: "Archivo no encontrado" });
    }
  }

  async create(req, res) {
    try {
      const archivo = await archivoDisenoService.create(req.body);
      res.json(archivo);
    } catch (error) {
      res.status(400).json({ error: "Error creando archivo" });
    }
  }

  async delete(req, res) {
    try {
      await archivoDisenoService.delete(req.params.id);
      res.json({ message: "Archivo eliminado correctamente" });
    } catch (error) {
      res.status(404).json({ error: "Archivo no encontrado" });
    }
  }
}

module.exports = new ArchivoDisenoController();
