module.exports = (sequelize, DataTypes) => {
  const Author = sequelize.define("Author", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    surname: {
      type: DataTypes.STRING,
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
  });

  Author.associate = (models) => {
    Author.belongsToMany(models.Publication, { through: "PublicationAuthors" });
  };

  Author.syncTable = async function () {
    await this.sync();
  };

  return Author;
};
