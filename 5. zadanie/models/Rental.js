module.exports = (sequelize, DataTypes) => {
  const Rental = sequelize.define("Rental", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    status: {
      type: DataTypes.ENUM('active', 'overdue', 'returned'),
      allowNull: false,
    }
  });

  Rental.associate = (models) => {
    Rental.belongsTo(models.Customer);
    Rental.belongsTo(models.Publication);
  };

  Rental.syncTable = async function () {
    await this.sync();
  };

  return Rental;
};
