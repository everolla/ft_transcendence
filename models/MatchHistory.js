export default (sequelize, DataTypes) => {
  const MatchHistory = sequelize.define('MatchHistory', {
    winner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    loser_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    played_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    score_winner: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    score_loser: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }

  }, {
    tableName: 'match_histories'
  })

  return MatchHistory
}