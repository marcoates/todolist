require('dotenv').config();
const express = require("express");
const _ = require("lodash");
const app = express();
const mongoose = require("mongoose");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', false);
const connectDB= async () =>{
try {
    mongoose.connect(process.env.MONGO_URI);}
catch (error) {
    console.log(error);
    process.exit(1);
}
};

const ItemSchema = new mongoose.Schema({
  name: String,
});

const ListSchema = new mongoose.Schema({
  name: String,
  items: [ItemSchema],
});

const Item = mongoose.model("Item", ItemSchema);

const List = mongoose.model("list", ListSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

app.set("view engine", "ejs");


// General Route

app.get("/", function (req, res) {
  Item.find({})
    .then(function (items) {
      if (items.length == 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Data saved!"); // Success
          })
          .catch(function (error) {
            console.log(error); // Failure
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});


// Customizable Route

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (nameFound) {
      if (!nameFound) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: customListName,
          newListItems: nameFound.items,
        });
      }
    })

    .catch(function (error) {
      console.log(error); // Failure
    });

});


// Add Elements

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    item.save();
    res.redirect("back");
  } else {
    List.findOne({ name: listName })
      .then(function (nameFound) {
        nameFound.items.push(item);
        nameFound.save();
        res.redirect("/" + listName);
      })

      .catch(function (error) {
        console.log(error); // Failure
      });
  }
});


// Delete Elements

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        res.redirect("/"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function (foundList) {
        res.redirect("/" + listName); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });
  }
});


// Connection

connectDB().then(() => {
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
});