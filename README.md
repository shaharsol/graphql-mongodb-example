# GraphQL Trello Example

Install, build and run:

```
npm install
npm run build
npm start
```

To see it in action, run some mutations, for example:
```
mutation{
  createList(title:"todo")
}

mutation{
  createCard(listId: "{list id returned by prev mutation}", title: "learn graphql")
}

mutation{
  createComment(cardId: "{card id returned by prev mutation}", content: "that was fun")
}
```


`createList`s, then `createCard`s for each list, then `createComment`s for each card, and then!

and then fetch the entire tree
```
{lists {
  _id
  title
  cards {
    _id
    listId
    title
    comments {
      _id
      cardId
      content
    }
  }
}}
```
