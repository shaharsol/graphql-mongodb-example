import {MongoClient, ObjectId} from 'mongodb'
import express from 'express'
import bodyParser from 'body-parser'
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express'
import {makeExecutableSchema} from 'graphql-tools'
import cors from 'cors'
import {prepare} from "../util/index"


const app = express()

app.use(cors())

const homePath = '/graphiql'
const URL = 'http://localhost'
const PORT = 3001
const MONGO_URL = 'mongodb://localhost:27017/graphql-trello'



export const start = async () => {
  try {
    const db = await MongoClient.connect(MONGO_URL)

    const Lists = db.collection('lists')
    const Cards = db.collection('cards')
    const Comments = db.collection('comments')

    const typeDefs = [`
      type Query {
        list(_id: String): List
        lists: [List]
        card(_id: String): Card
        comment(_id: String): Comment
      }

      type List {
        _id: String
        title: String
        cards: [Card]
      }

      type Card {
        _id: String
        listId: String
        title: String
        list: List
        comments: [Comment]
      }

      type Comment {
        _id: String
        cardId: String
        content: String
        card: Card
      }

      type Mutation {
        createList(title: String): List
        createCard(listId: String, title: String): Card
        createComment(cardId: String, content: String): Comment
      }

      schema {
        query: Query
        mutation: Mutation
      }
    `];

    const resolvers = {
      Query: {
        list: async (root, {_id}) => {
          return prepare(await Lists.findOne(ObjectId(_id)))
        },
        lists: async () => {
          return (await Lists.find({}).toArray()).map(prepare)
        },
        card: async (root, {_id}) => {
          return prepare(await Cards.findOne(ObjectId(_id)))
        },
        comment: async (root, {_id}) => {
          return prepare(await Comments.findOne(ObjectId(_id)))
        },
      },
      List: {
        cards: async ({_id}) => {
          return (await Cards.find({listId: _id}).toArray()).map(prepare)
        }
      },
      Card: {
        list: async ({listId}) => {
          return prepare(await Lists.findOne(ObjectId(listId)))
        },
        comments: async ({_id}) => {
          return (await Comments.find({cardId: _id}).toArray()).map(prepare)
        }
      },
      Comment: {
        card: async ({cardId}) => {
          return prepare(await Cards.findOne(ObjectId(cardId)))
        }
      },
      Mutation: {
        createList: async (root, args, context, info) => {
          const res = await Lists.insertOne(args)
          return prepare(res.ops[0])  // https://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#~insertOneWriteOpResult
        },
        createCard: async (root, args) => {
          const res = await Cards.insert(args)
          return prepare(await Cards.findOne({_id: res.insertedIds[0]}))
        },
        createComment: async (root, args) => {
          const res = await Comments.insert(args)
          return prepare(await Comments.findOne({_id: res.insertedIds[0]}))
        },
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    })


    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))


    app.use(homePath, graphiqlExpress({
      endpointURL: '/graphql'
    }))

    app.listen(PORT, () => {
      console.log(`Visit ${URL}:${PORT}${homePath}`)
    })

  } catch (e) {
    console.log(e)
  }

}
