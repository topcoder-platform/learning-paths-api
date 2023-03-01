const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TopcoderUdemyCourse extends Model {
    static associate(models) {
      this.hasOne(models.CertificationResource, {
        as: 'TopcoderUdemyCourse',
        foreignKey: 'id',
        constraints: false,
        scope: {
          resourceableType: 'TopcoderUdemyCourse',
        }
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
    modelName: 'TopcoderUdemyCourse',
    schema: 'public',
    timestamps: false,
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
