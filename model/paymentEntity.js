const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define("Payment", {
  payment_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  user_email: { type: DataTypes.STRING, allowNull: false },
  order_name: { type: DataTypes.STRING },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  currency: { type: DataTypes.STRING, defaultValue: "KRW" },
  pg_provider: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM("attempted", "success", "failed"), defaultValue: "attempted" },
  imp_uid: { type: DataTypes.STRING },
  paid_amount: { type: DataTypes.INTEGER },
  error_message: { type: DataTypes.TEXT }
}, {
  timestamps: true,
  updatedAt: "updated_at",
  createdAt: "created_at"
});

module.exports = Payment;
