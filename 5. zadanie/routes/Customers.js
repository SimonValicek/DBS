const express = require("express");
const router = express.Router();
const { Customer, Rental, Reservation } = require("../models");

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//POST REQUEST
router.post("/", async (req, res) => {
  try {
    const userObject = req.body;

    const customer = await Customer.findOne({
      where: { email: userObject.email },
    });

    if (customer) {
      return res.status(409).end();
    }

    const newCustomer = await Customer.create({
      id: userObject.id,
      name: userObject.name,
      surname: userObject.surname,
      email: userObject.email,
      birth_date: userObject.birth_date,
      id_number: userObject.personal_identificator,
    });

    return res.status(201).json({
      id: newCustomer.id,
      name: newCustomer.name,
      surname: newCustomer.surname,
      email: newCustomer.email,
      birth_date: newCustomer.birth_date,
      personal_identificator: newCustomer.id_number,
      created_at: newCustomer.createdAt.toISOString(),
      updated_at: newCustomer.updatedAt.toISOString(),
    });
  } catch (err) {
    return res.status(400).end();
  }
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//PATCH REQUEST
router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  const userObject = req.body;

  Customer.findByPk(id)
    .then((customer) => {
      if (!customer) return res.status(404).end();

      customer
        .update({
          name: userObject.name || customer.name,
          surname: userObject.surname || customer.surname,
          email: userObject.email || customer.email,
          birth_date: userObject.birth_date || customer.birth_date,
          id_number: userObject.personal_identificator || customer.id_number,
        })
        .then(() => {
          return Customer.findByPk(id);
        })
        .then((customer) => {
          return res.status(200).json({
            id: customer.id,
            name: customer.name,
            surname: customer.surname,
            email: customer.email,
            birth_date: customer.birth_date,
            personal_identificator: customer.id_number,
            created_at: customer.createdAt.toISOString(),
            updated_at: customer.updatedAt.toISOString(),
          });
        });
    })
    .catch(() => {
      return res.status(400).end();
    });
});

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//GET REQUEST
router.get("/:id", async (req, res) => {
  Customer.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Reservation,
        as: "reservations",
      },
      {
        model: Rental,
        as: "rentals",
      },
    ],
  })
    .then((customer) => {
      if (!customer) return res.status(404).end();

      const response = {
        id: customer.id,
        name: customer.name,
        surname: customer.surname,
        email: customer.email,
        birth_date: customer.birth_date,
        personal_identificator: customer.id_number,
      };

      if (customer.reservations.length > 0) {
        response.reservations = customer.reservations.map((r) => ({
          id: r.id,
          user_id: r.customer_id,
          publication_id: r.publication_id,
          created_at: r.createdAt.toISOString(),
        }));
      }

      if (customer.rentals.length > 0) {
        response.rentals = customer.rentals.map((r) => ({
          id: r.id,
          user_id: r.CustomerId,
          publication_instance_id: r.PublicationId,
          duration: r.duration,
          start_date: r.createdAt.toISOString(),
          end_date: new Date(
            r.createdAt.getTime() + r.duration * 24 * 60 * 60 * 1000
          ),
          status: r.status,
        }));
      }

      response.created_at = customer.createdAt.toISOString();
      response.updated_at = customer.updatedAt.toISOString();

      return res.status(200).json(response);
    })
    .catch(() => {
      return res.status(400).end();
    });
});

module.exports = router;
