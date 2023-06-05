module.exports = (sequelize, DataTypes) => {
  const Instance = sequelize.define("Instance", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    type: {
      type: DataTypes.ENUM("physical", "ebook", "audiobook"),
      allowNull: false,
    },
    publisher: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
      },
    },
    status: {
      type: DataTypes.ENUM("available", "reserved"),
      allowNull: false,
      defaultValue: "available",
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
  });

  Instance.associate = (models) => {
    Instance.belongsTo(models.Publication);
  };

  Instance.syncTable = async function () {
    await this.sync();
  };

  return Instance;
};
