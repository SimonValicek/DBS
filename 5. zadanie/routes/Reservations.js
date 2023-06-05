const express = require("express");
const router = express.Router();
const { Reservation, Customer, Publication, Instance } = require("../models");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  const reservationObject = req.body;

  try {
    const customer = await Customer.findByPk(reservationObject.user_id);
    if (!customer) return res.status(400).end();

    const publication = await Publication.findByPk(
      reservationObject.publication_id
    );
    if (!publication) return res.status(400).end();

    const instance = await Instance.findOne({
      where: {
        PublicationId: reservationObject.publication_id,
        status: "available",
      },
      include: Publication,
    });

    if (!instance) return res.status(400).end();

    const reservation = await Reservation.create({
      id: reservationObject.id,
      CustomerId: reservationObject.user_id,
      PublicationId: reservationObject.publication_id,
    });

    return res.status(201).json({
      id: reservation.id,
      user_id: reservation.CustomerId,
      publication_id: reservation.PublicationId,
      created_at: reservation.createdAt.toISOString(),
    });
  } catch (error) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).end();

    return res.status(200).json({
      id: reservation.id,
      user_id: reservation.CustomerId,
      publication_id: reservation.PublicationId,
      created_at: reservation.createdAt.toISOString(),
    });
  } catch (error) {
    return res.status(500).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//DELETE REQUEST
router.delete("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).end();

    await reservation.destroy();
    return res.status(204).end();
  } catch (error) {
    return res.status(500).end();
  }
});

module.exports = router;
