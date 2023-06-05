const express = require("express");
const router = express.Router();
const { Publication, Instance } = require("../models");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  const instanceObject = req.body;

  if (instanceObject.hasOwnProperty("status")) {
    const allowedStatusValues = ["available", "reserved"];
    if (!allowedStatusValues.includes(instanceObject.status)) {
      return res.status(400).end();
    }
  }

  try {
    const instance = await Instance.findOne({
      where: { id: instanceObject.id },
    });

    if (instance) return res.status(409).end();

    const publication = await Publication.findByPk(
      instanceObject.publication_id
    );
    if (!publication) return res.status(400).end();

    const createdInstance = await Instance.create({
      id: instanceObject.id,
      type: instanceObject.type,
      publisher: instanceObject.publisher,
      year: instanceObject.year,
      status: instanceObject.status || "available",
      PublicationId: instanceObject.publication_id,
    });

    return res.status(201).json({
      id: createdInstance.id,
      type: createdInstance.type,
      publisher: createdInstance.publisher,
      year: parseInt(createdInstance.year),
      status: createdInstance.status,
      publication_id: createdInstance.PublicationId,
      created_at: createdInstance.createdAt.toISOString(),
      updated_at: createdInstance.updatedAt.toISOString(),
    });
  } catch (error) {
    console.log(error);
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//PATCH REQUEST
router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  const instanceObject = req.body;

  if (instanceObject.hasOwnProperty("status")) {
    const allowedStatusValues = ["available", "reserved"];
    if (!allowedStatusValues.includes(instanceObject.status))
      return res.status(400).end();
  }

  try {
    const publication = await Publication.findByPk(
      instanceObject.publication_id
    );
    if (!publication) return res.status(400).end();

    const instance = await Instance.findByPk(id, { include: Publication });
    if (!instance) return res.status(404).end();

    const updatedAttributes = {};
    if (instanceObject.hasOwnProperty("type"))
      updatedAttributes.type = instanceObject.type;
    if (instanceObject.hasOwnProperty("publisher"))
      updatedAttributes.publisher = instanceObject.publisher;
    if (instanceObject.hasOwnProperty("year"))
      updatedAttributes.year = instanceObject.year;
    if (instanceObject.hasOwnProperty("status"))
      updatedAttributes.status = instanceObject.status;
    if (
      instanceObject.hasOwnProperty("publication_id") &&
      instanceObject.publication_id !== instance.PublicationId
    ) {
      const publication = await Publication.findByPk(
        instanceObject.publication_id
      );
      if (!publication) return res.status(400).end();
    }

    await instance.update(updatedAttributes);
    const updatedInstance = await Instance.findByPk(id, {
      include: Publication,
    });

    return res.status(200).json({
      id: updatedInstance.id,
      type: updatedInstance.type,
      publisher: updatedInstance.publisher,
      year: parseInt(updatedInstance.year),
      status: updatedInstance.status,
      publication_id: updatedInstance.PublicationId,
      created_at: updatedInstance.createdAt.toISOString(),
      updated_at: updatedInstance.updatedAt.toISOString(),
      debug: {
        instanceObject: instanceObject,
        instance: instance.toJSON(),
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  try {
    const instance = await Instance.findByPk(req.params.id, {
      include: Publication,
    });

    if (!instance) return res.status(404).end();

    return res.status(200).json({
      id: instance.id,
      type: instance.type,
      publisher: instance.publisher,
      year: parseInt(instance.year),
      status: instance.status,
      publication_id: instance.PublicationId,
      created_at: instance.createdAt.toISOString(),
      updated_at: instance.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//DELETE REQUEST
router.delete("/:id", async (req, res) => {
  try {
    const instance = await Instance.findByPk(req.params.id, {
      include: Publication,
    });

    if (!instance) return res.status(404).end();

    await instance.destroy();
    return res.status(204).end();
  } catch (error) {
    return res.status(400).end();
  }
});

module.exports = router;
