const express = require("express");
const router = express.Router();
const { Publication, Instance, Rental, Customer } = require("../models");
const moment = require("moment");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  try {
    const rentalObject = req.body;

    if (
      !rentalObject.user_id ||
      !rentalObject.publication_id ||
      !rentalObject.duration ||
      !Number.isInteger(rentalObject.duration)
    )
      return res.status(400).end();

    const duration = parseInt(rentalObject.duration);
    if (duration <= 0 || duration > 14) return res.status(400).end();

    const customer = await Customer.findByPk(rentalObject.user_id);
    const publication = await Publication.findByPk(rentalObject.publication_id);

    if (!customer || !publication) return res.status(400).end();

    const instance = await Instance.findOne({
      where: {
        PublicationId: rentalObject.publication_id,
        status: "available",
      },
      include: Publication,
    });

    if (!instance) return res.status(400).end();

    Rental.create({
      id: rentalObject.id,
      duration: rentalObject.duration,
      CustomerId: rentalObject.user_id,
      PublicationId: rentalObject.publication_id,
      status: "active",
    }).then((rental) => {
      const startDate = moment(rental.createdAt);
      const endDate = moment(startDate).add(rental.duration, "days");

      instance.update({ status: "reserved" });

      return res.status(201).json({
        id: rental.id,
        user_id: rental.CustomerId,
        publication_instance_id: instance.id,
        duration: rental.duration,
        start_date: rental.createdAt.toISOString(),
        end_date: endDate.toISOString(),
        status: rental.status,
      });
    });
  } catch (err) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//PATCH REQUEST
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const rentalObject = req.body;

    if (!Number.isInteger(rentalObject.duration)) return res.status(400).end();

    if (!rentalObject.duration) return res.status(400).end();

    const duration = parseInt(rentalObject.duration);
    if (duration <= 0 || duration > 14) return res.status(400).end();

    const rental = await Rental.findByPk(id);
    if (!rental) return res.status(404).end();

    if (rental.status !== "active") return res.status(400).end();

    await rental.update({ duration });
    const updatedRental = await Rental.findByPk(id);

    const startDate = moment(updatedRental.createdAt);
    const endDate = moment(startDate).add(updatedRental.duration, "days");

    return res.status(200).json({
      id: updatedRental.id,
      user_id: updatedRental.CustomerId,
      publication_instance_id: updatedRental.PublicationId,
      duration: updatedRental.duration,
      start_date: updatedRental.createdAt.toISOString(),
      end_date: endDate.toISOString(),
      status: updatedRental.status,
    });
  } catch (err) {
    return res.status(400).end();
  }
});
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  const id = req.params.id;

  if (!Number.isInteger(rentalObject.duration)) return res.status(400).end();

  try {
    const rental = await Rental.findByPk(id, {
      include: Customer,
      Publication,
    });
    if (!rental) return res.status(404).end();

    const startDate = moment(rental.createdAt);
    const endDate = moment(startDate).add(rental.duration, "days");
    return res.status(200).json({
      id: rental.id,
      user_id: rental.CustomerId,
      publication_instance_id: rental.PublicationId,
      duration: rental.duration,
      start_date: rental.createdAt.toISOString(),
      end_date: endDate.toISOString(),
      status: rental.status,
    });
  } catch (error) {
    return res.status(400).end();
  }
});

module.exports = router;
