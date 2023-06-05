module.exports = (sequelize, DataTypes) => {
  const Publication = sequelize.define('Publication', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  })

  Publication.associate = (models) => {
    Publication.belongsToMany(models.Category,  {through: 'PublicationCategories'})
    Publication.belongsToMany(models.Author,  {through: 'PublicationAuthors'})
    Publication.hasMany(models.Instance, {as: 'instances'})
    Publication.hasMany(models.Reservation, {as: "reservations"})
    Publication.hasMany(models.Rental, {as: "rentals"})
  }

  Publication.syncTable = async function () {
    await this.sync()
  }

  return Publication
}
