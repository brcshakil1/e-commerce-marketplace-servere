# e-commerce-marketplace

## Instructions

### MongoDB

- Create a user on mondoDB and set the username and password on mongoDB uri

### Login/Token

- endpoint: /api/auth/login
- Create a secret key and replace it instead of process.env.SECRET_KEY

### Register User

-endpoint: /api/auth/register

- You have to send an object as a body
  example:

```
-----------------------------
const newUser = {
email: "example@gmail.com",
name: "User Name",
username: "example"
typeOfUser: "seller",
}
------------------------------
```

### Get all seller

- endpoint: /api/buyer/list-of-sellers

### buyer create order from specific seller

- To get specific catalog, call by the endpoint: /api/buyer/create-order/:seller_id
- note: ":seller_id" replace by "\_id"
- if seller doesn't receive any order then create a new order by buyer
  example:

```
----------------------------------------------
const newOrder = {
          sellerId,
          orders: req.body.orders || [],
}
----------------------------------------------
```

### Catalog

- Seller create new catalog to add items. endpoint: /api/seller/create-catalog
- You have to send "sellerId" and "catalog" in body
- if seller doesn't create a catalog then create a new catalog

```
----------------------------------------
const newCatalog = {
          sellerId,
          catalog: req.body.catalog,
          items: req.body.items || [],
};
-----------------------------------------
```

### Get all seller's order by buyer

- endpoint : /api/seller/orders/:seller_id
- Send "seller_id" as a params
