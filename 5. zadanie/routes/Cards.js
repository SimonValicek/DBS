const express = require("express");
const router = express.Router();
const { Card, Customer } = require("../models");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  try {
    const cardObject = req.body;

    const allowedStatusValues = ["active", "inactive", "expired"];
    if (!allowedStatusValues.includes(cardObject.status))
      return res.status(400).end();

    const customer = await Customer.findByPk(cardObject.user_id);

    if (!customer) return res.status(409).end();

    const card = await Card.create({
      id: cardObject.id,
      customer_id: cardObject.user_id,
      ean_code: cardObject.magstripe,
      status: cardObject.status,
    });

    return res.status(201).json({
      id: card.id,
      user_id: card.customer_id,
      magstripe: card.ean_code,
      status: card.status,
      created_at: card.createdAt.toISOString(),
      updated_at: card.updatedAt.toISOString(),
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
    const cardObject = req.body;

    const allowedStatusValues = ["active", "inactive", "expired"];
    if (!allowedStatusValues.includes(cardObject.status))
      return res.status(400).end();

    if (cardObject.user_id) {
      const customer = await Customer.findByPk(cardObject.user_id);
      if (!customer) return res.status(404).end();
    }

    const card = await Card.findByPk(id);

    if (!card) return res.status(404).end();

    await card.update({
      status: cardObject.status || card.status,
    });

    const updatedCard = await Card.findByPk(id);

    return res.status(200).json({
      id: updatedCard.id,
      user_id: updatedCard.customer_id,
      magstripe: updatedCard.ean_code,
      status: updatedCard.status,
      created_at: updatedCard.createdAt.toISOString(),
      updated_at: updatedCard.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const card = await Card.findByPk(id);

    if (!card) return res.status(404).end();

    return res.status(200).json({
      id: card.id,
      user_id: card.customer_id,
      magstripe: card.ean_code,
      status: card.status,
      created_at: card.createdAt.toISOString(),
      updated_at: card.updatedAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//DELETE REQUEST
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const card = await Card.findByPk(id);

    if (!card) return res.status(404).end();

    await card.destroy();

    return res.status(204).end();
  } catch (error) {
    return res.status(500).end();
  }
});

module.exports = router;
