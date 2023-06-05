module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Instances", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM("physical", "ebook", "audiobook"),
        allowNull: false,
      },
      publisher: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          isInt: true,
        },
      },
      status: {
        type: Sequelize.ENUM("available", "reserved"),
        allowNull: false,
        defaultValue: "available",
      },
      PublicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Publications",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Instances");
  },
};
