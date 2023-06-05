const express = require("express");
const router = express.Router();
const { Author } = require("../models");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  const authorObject = req.body;

  try {
    if (!authorObject.id || !authorObject.name || !authorObject.surname)
      return res.status(400).end();

    const author = await Author.findOne({ where: { id: authorObject.id } });

    if (author) return res.status(409).end();

    const newAuthor = await Author.create({
      id: authorObject.id,
      name: authorObject.name,
      surname: authorObject.surname,
    });

    return res.status(201).json({
      id: newAuthor.id,
      name: newAuthor.name,
      surname: newAuthor.surname,
      created_at: newAuthor.createdAt.toISOString(),
      updated_at: newAuthor.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//PATCH REQUEST
router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  const authorObject = req.body;

  try {
    const author = await Author.findByPk(id);
    if (!author) return res.status(404).end();

    await author.update({
      name: authorObject.name || author.name,
      surname: authorObject.surname || author.surname,
    });

    const updatedAuthor = await Author.findByPk(id);

    return res.status(200).json({
      id: updatedAuthor.id,
      name: updatedAuthor.name,
      surname: updatedAuthor.surname,
      created_at: updatedAuthor.createdAt.toISOString(),
      updated_at: updatedAuthor.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id);
    if (!author) return res.status(404).end();

    return res.status(200).json({
      id: author.id,
      name: author.name,
      surname: author.surname,
      created_at: author.createdAt.toISOString(),
      updated_at: author.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//DELETE REQUEST
router.delete("/:id", async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id);
    if (!author) return res.status(404).end();

    await author.destroy();
    return res.status(204).end();
  } catch (error) {
    return res.status(500).end();
  }
});

module.exports = router;
