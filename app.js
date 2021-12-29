const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB")

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Pen"
})

const item2 = new Item({
  name: "Pencil"
})

const item3 = new Item({
  name: "Eraser"
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema)

app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err)
        }
        else {
          console.log("Saved")
        }
      })
      res.redirect("/")
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems })
    }
  })

});

app.get("/:customName", function (req, res) {
  const customName = _.capitalize(req.params.customName)

  List.findOne({ name: customName }, function (err, found) {
    if (!err) {
      if (!found) {
        const list = new List({
          name: customName,
          items: defaultItems
        })
        list.save()
        res.redirect("/" + customName)
      }
      else {
        console.log("Exists")
        res.render("list", { listTitle: customName, newListItems: found.items })
      }
    }
  })
})

app.post("/", function (req, res) {

  const itemName = req.body.newItem
  const listName = req.body.list

  const newItem = new Item({
    name: itemName
  })
  if (listName === "Today") {
    newItem.save()
    res.redirect("/")
  }
  else {
    List.findOne({ name: listName }, function (err, found) {
      found.items.push(newItem)
      found.save()
      res.redirect("/" + listName)
    })
  }
});

app.post("/delete", function (req, res) {
  const deleteThisID = req.body.checkbox
  const listName = req.body.listName

  if (listName == "Today") {
    Item.findByIdAndDelete(deleteThisID, function (err) {
      if (err) {
        console.log(err)
      }
      else {
        console.log("Deleted")
        res.redirect("/")
      }
    })
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: deleteThisID } } }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName)
      }
    })
  }

})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started");
});
