export default (sequelize, DataTypes) => {
  const Friend = sequelize.define('Friend', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    friend_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    accepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'friends'
  })

  return Friend
}