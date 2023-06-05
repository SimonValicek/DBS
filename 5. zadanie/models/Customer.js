module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define("Customer", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    surname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    id_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
    }
  })

 Customer.associate = (models) => {
    Customer.hasMany(models.Rental, {as: "rentals"})
    Customer.hasMany(models.Reservation, {as: "reservations"})
    Customer.hasMany(models.Card, { as: "cards", foreignKey: "customer_id" });
  }

  Customer.syncTable = async function () {
    await this.sync()
  }

  return Customer
}
