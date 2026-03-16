const { Router } = require("express");
const archivoDisenoController = require("../controllers/archivoDisenoController.js");

const router = Router();

router.get("/", archivoDisenoController.getAll);
router.get("/:id", archivoDisenoController.getById);
router.post("/", archivoDisenoController.create);
router.delete("/:id", archivoDisenoController.delete);

module.exports = router;
