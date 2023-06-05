const express = require("express");
const router = express.Router();
const { Category } = require("../models");
const { Op } = require("sequelize");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  try {
    const categoryObject = req.body;

    if (!categoryObject.name) return res.status(400).end();

    const existingCategory = await Category.findOne({
      where: {
        [Op.or]: [{ id: categoryObject.id }, { title: categoryObject.name }],
      },
    });

    if (existingCategory) return res.status(409).end();

    const category = await Category.create({
      id: categoryObject.id,
      title: categoryObject.name,
    });

    return res.status(201).json({
      id: category.id,
      name: category.title,
      created_at: category.createdAt.toISOString(),
      updated_at: category.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//PATCH REQUEST
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const categoryObject = req.body;

    if (!categoryObject.name) return res.status(400).end();

    const existingCategory = await Category.findOne({
      where: {
        id: {
          [Op.ne]: id,
        },
        title: categoryObject.name,
      },
    });

    if (existingCategory) return res.status(409).end();

    const category = await Category.findByPk(id);

    if (!category) return res.status(404).end();

    await category.update({
      title: categoryObject.name || category.name,
    });

    const updatedCategory = await Category.findByPk(id);

    return res.status(200).json({
      id: updatedCategory.id,
      name: updatedCategory.title,
      created_at: updatedCategory.createdAt.toISOString(),
      updated_at: updatedCategory.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) return res.status(404).end();

    return res.status(200).json({
      id: category.id,
      name: category.title,
      created_at: category.createdAt.toISOString(),
      updated_at: category.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//DELETE REQUEST
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) return res.status(404).end();

    await category.destroy();

    return res.status(204).end();
  } catch (error) {
    return res.status(500).end();
  }
});

module.exports = router;
