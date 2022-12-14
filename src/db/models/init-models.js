var DataTypes = require("sequelize").DataTypes;
var _CertificationCategory = require("./CertificationCategory");
var _CertificationResource = require("./CertificationResource");
var _DataVersion = require("./DataVersion");
var _FreeCodeCampCertification = require("./FreeCodeCampCertification");
var _ResourceProvider = require("./ResourceProvider");
var _TopcoderCertification = require("./TopcoderCertification");
var _TopcoderUdemyCourse = require("./TopcoderUdemyCourse");
var _UdemyCourse = require("./UdemyCourse");

function initModels(sequelize) {
  var CertificationCategory = _CertificationCategory(sequelize, DataTypes);
  var CertificationResource = _CertificationResource(sequelize, DataTypes);
  var DataVersion = _DataVersion(sequelize, DataTypes);
  var FreeCodeCampCertification = _FreeCodeCampCertification(sequelize, DataTypes);
  var ResourceProvider = _ResourceProvider(sequelize, DataTypes);
  var TopcoderCertification = _TopcoderCertification(sequelize, DataTypes);
  var TopcoderUdemyCourse = _TopcoderUdemyCourse(sequelize, DataTypes);
  var UdemyCourse = _UdemyCourse(sequelize, DataTypes);

  FreeCodeCampCertification.belongsTo(CertificationCategory, { as: "certificationCategory", foreignKey: "certificationCategoryId" });
  CertificationCategory.hasMany(FreeCodeCampCertification, { as: "FreeCodeCampCertifications", foreignKey: "certificationCategoryId" });
  TopcoderCertification.belongsTo(CertificationCategory, { as: "certificationCategory", foreignKey: "certificationCategoryId" });
  CertificationCategory.hasMany(TopcoderCertification, { as: "TopcoderCertifications", foreignKey: "certificationCategoryId" });
  CertificationResource.belongsTo(ResourceProvider, { as: "resourceProvider", foreignKey: "resourceProviderId" });
  ResourceProvider.hasMany(CertificationResource, { as: "CertificationResources", foreignKey: "resourceProviderId" });

  return {
    CertificationCategory,
    CertificationResource,
    DataVersion,
    FreeCodeCampCertification,
    ResourceProvider,
    TopcoderCertification,
    TopcoderUdemyCourse,
    UdemyCourse
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
