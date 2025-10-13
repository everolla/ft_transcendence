import Sequelize from 'sequelize'
import UserModel from './User.js'
import FriendModel from './Friend.js'
import MatchHistoryModel from './MatchHistory.js'
import OTPModel from './OTP.js'

// Inizializza connessione Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite',
  logging: false,
})

// Inizializza modelli
const models = {
  User: UserModel(sequelize, Sequelize.DataTypes),
  Friend: FriendModel(sequelize, Sequelize.DataTypes),
  MatchHistory: MatchHistoryModel(sequelize, Sequelize.DataTypes),
  OTP: OTPModel(sequelize, Sequelize.DataTypes),
}

// Esegui associazioni
Object.values(models)
  .filter((model) => typeof model.associate === 'function')
  .forEach((model) => model.associate(models))

export { sequelize }
export default models
