export default (sequelize, DataTypes) => {
  const OTP = sequelize.define('OTP', {
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    otp_code: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    }
  })

  // Automatic cleanup method
  OTP.cleanExpired = async () => {
    await OTP.destroy({
      where: {
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    })
  }

  return OTP
}