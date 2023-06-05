const express = require("express");
const router = express.Router();
const { Publication, Category, Author } = require("../models");
const { Op } = require("sequelize");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  const publicationObject = req.body;

  const categoryPromises = publicationObject.categories.map((categoryTitle) => {
    return Category.findOne({
      where: {
        title: categoryTitle,
      },
    });
  });
  const authorPromises = publicationObject.authors.map((authorObject) => {
    return Author.findOne({
      where: {
        name: authorObject.name,
        surname: authorObject.surname,
      },
    });
  });

  try {
    const categories = await Promise.all(categoryPromises);
    const authors = await Promise.all(authorPromises);

    const categoryIds = categories.map((category) => category?.id);
    const authorIds = authors.map((author) => author?.id);

    if (!categoryIds.every(Boolean) || !authorIds.every(Boolean)) {
      return res.status(400).end();
    }

    const publication = await Publication.findOne({
      where: {
        [Op.or]: [
          { id: publicationObject.id },
          { title: publicationObject.title },
        ],
      },
    });
    if (publication) {
      return res.status(409).end();
    }

    const createdPublication = await Publication.create({
      id: publicationObject.id,
      title: publicationObject.title,
    });
    await createdPublication.addCategories(categoryIds);
    await createdPublication.addAuthors(authorIds);

    return res.status(201).json({
      id: createdPublication.id,
      title: createdPublication.title,
      authors: publicationObject.authors,
      categories: publicationObject.categories,
      created_at: createdPublication.createdAt.toISOString(),
      updated_at: createdPublication.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//PATCH REQUEST
router.patch("/:id", async (req, res) => {
  const publication = await Publication.findOne({
    where: { id: req.params.id },
    include: [{ model: Category }, { model: Author }],
  });

  if (!publication) return res.status(404).end();

  const authorNames = req.body.authors.map((author) => ({
    name: author.name,
    surname: author.surname,
  }));

  const authors = await Author.findAll({ where: { [Op.or]: authorNames } });
  if (authorNames.length !== authors.length) return res.status(400).end();

  const categoryTitles = req.body.categories;
  const categories = await Category.findAll({
    where: { title: categoryTitles },
  });
  if (categoryTitles.length !== categories.length) return res.status(400).end();

  await publication.setAuthors([]);
  await publication.setCategories([]);

  const newAuthors = authors.map((author) => author.id);
  const newCategories = categories.map((category) => category.id);
  await publication.addAuthors(newAuthors);
  await publication.addCategories(newCategories);

  publication.save();
  const updatedPublication = await Publication.findOne({
    where: { id: req.params.id },
    include: [{ model: Category }, { model: Author }],
  });

  const publicationObject = {
    id: updatedPublication.id,
    title: updatedPublication.title,
    authors: updatedPublication.Authors.map((author) => ({
      name: author.name,
      surname: author.surname,
    })),
    categories: updatedPublication.Categories.map((category) => category.title),
    created_at: updatedPublication.createdAt.toISOString(),
    updated_at: updatedPublication.updatedAt.toISOString(),
  };

  return res.status(200).json(publicationObject);
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  Publication.findOne({
    where: { id: req.params.id },
    include: [{ model: Category }, { model: Author }],
  }).then((publication) => {
    if (!publication) return res.status(404).end();

    return res.status(200).json({
      id: publication.id,
      title: publication.title,
      authors: publication.Authors.map((author) => ({
        name: author.name,
        surname: author.surname,
      })),
      categories: publication.Categories.map((category) => category.title),
      created_at: publication.createdAt.toISOString(),
      updated_at: publication.updatedAt.toISOString(),
    });
  });
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//DELETE REQUEST
router.delete("/:id", async (req, res) => {
  const publication = await Publication.findOne({
    where: { id: req.params.id },
    include: [{ model: Category }, { model: Author }],
  });

  if (!publication) return res.status(404).end();

  await publication.setAuthors([]);
  await publication.setCategories([]);
  publication
    .destroy()
    .then(() => {
      return res.status(204).end();
    })
    .catch(() => {
      return res.status(400).end();
    });
});

module.exports = router;
