export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: "public/avatars/default.png",
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    won_matches: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lost_matches: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    tableName: 'users'
    })

  User.associate = (models) => {

    User.belongsToMany(User, {
      as: 'friends',
      through: models.Friend,
      foreignKey: 'user_id',
      otherKey: 'friend_id'
    })

    User.hasMany(models.MatchHistory, { as: 'wonMatches', foreignKey: 'winner_id' })
    User.hasMany(models.MatchHistory, { as: 'lostMatches', foreignKey: 'loser_id' })
    
  }

  return User
}