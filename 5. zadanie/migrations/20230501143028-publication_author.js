module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("PublicationAuthors", {
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
      AuthorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Authors",
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("PublicationAuthors");
  },
};
