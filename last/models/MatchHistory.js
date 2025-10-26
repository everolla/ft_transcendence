export default (sequelize, DataTypes) => {
  const MatchHistory = sequelize.define('MatchHistory', {
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    opponent_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    played_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    player_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    opponent_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }

  }, {
    tableName: 'match_histories'
  })

  MatchHistory.associate = (models) => {
    MatchHistory.belongsTo(models.User, { as: 'player', foreignKey: 'player_id' })
  }

  return MatchHistory
}