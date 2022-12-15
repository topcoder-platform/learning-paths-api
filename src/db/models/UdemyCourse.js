const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('UdemyCourse', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    headline: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    categories: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    topics: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    promo_video_url: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    instructors: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    requirements: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    what_you_will_learn: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    level: {
      type: DataTypes.ENUM("Beginner", "Intermediate", "Expert", "All Levels"),
      allowNull: false
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    locale: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    primary_category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    primary_subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estimated_content_length: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    estimated_content_length_video: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    num_lectures: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    num_videos: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    last_update_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    data_version: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'UdemyCourse',
    modelName: 'UdemyCourse',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "UdemyCourse_pkey",
        unique: true,
        fields: [
          { name: "id" },
          { name: "data_version" },
        ]
      },
    ]
  });
};
