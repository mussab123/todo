//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://musab12:033551@cluster0.bs9w8.mongodb.net/myFirstDatabase",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family: 4,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- hit this delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find(function (err, founditems) {
    if (founditems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: founditems });
    }
  });
});

app.get("/:customeListName", function (req, res) {
  const customeName = _.capitalize(req.params.customeListName);

  List.findOne({ name: customeName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customeName,
          items: defaultItems,
        });

        list.save();

        res.redirect("/" + customeName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const itame = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    itame.save();

    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(itame);

      foundList.save();

      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const value = req.body.checkbox;

  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(value, function (err) {
      if (!err) {
        console.log("success");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: value } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 401;
}

app.listen(port, function () {
  console.log("Server started on port 401");
});
