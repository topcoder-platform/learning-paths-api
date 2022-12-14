const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TopcoderUdemyCourse extends Model {
    static associate(models) {
      this.belongsTo(models.CertificationResource, {
        foreignKey: 'resourceableId',
        constraints: false
      });
    }
  }

  TopcoderUdemyCourse.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("available", "coming_soon", "not_available", "removed"),
      allowNull: false,
      defaultValue: "available"
    },
    removedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TopcoderUdemyCourse',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "TopcoderUdemyCourse_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });

  return TopcoderUdemyCourse;
};
