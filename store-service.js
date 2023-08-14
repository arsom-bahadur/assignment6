/********************************************************************************* 

WEB322 – Assignment 02 
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party web sites) or 
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name: Ashis Roka Som Bahadur
Student ID: 135377216
Date: 2023/08/12
Cyclic Web App URL: https://tiny-gray-sawfish-robe.cyclic.app
GitHub Repository URL: https://github.com/arsom-bahadur/assignment6

********************************************************************************/
const Sequelize = require("sequelize");
var sequelize = new Sequelize(
  "zafjmjyb",
  "zafjmjyb",
  "QynfqI8kuA5tTlxmPnUuNA8w5Pp7PG8q",
  {
    host: "mahmud.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

const Item = sequelize.define("item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

// Define the Category model
const Category = sequelize.define("category", {
  category: Sequelize.STRING,
});

// Define the relationship: Item belongs to Category
Item.belongsTo(Category, { foreignKey: "categoryID" });

module.exports.initialize = function () {
  return sequelize
    .sync()
    .then(() => {
      console.log("Database synced");
    })
    .catch((err) => {
      throw new Error("Unable to sync the database");
    });
};

module.exports.getAllItems = function () {
  return Item.findAll()
    .then((items) => {
      return items;
    })
    .catch((err) => {
      throw new Error("No results returned");
    });
};

module.exports.getItemsByCategory = function (category) {
  return Item.findAll({
    where: {
      category: category,
    },
  })
    .then((items) => {
      return items;
    })
    .catch((err) => {
      throw new Error("No results returned");
    });
};

module.exports.getItemsByMinDate = function (minDateStr) {
  return Item.findAll({
    where: {
      postDate: {
        [Sequelize.Op.gte]: new Date(minDateStr),
      },
    },
  })
    .then((items) => {
      return items;
    })
    .catch((err) => {
      throw new Error("No results returned");
    });
};

module.exports.getItemById = function (id) {
  return Item.findAll({
    where: {
      id: id,
    },
  })
    .then((items) => {
      if (items.length > 0) {
        return items[0];
      } else {
        throw new Error("No results returned");
      }
    })
    .catch((err) => {
      throw new Error("No results returned");
    });
};

module.exports.addItem = function (itemData) {
  itemData.published = itemData.published ? true : false;

  for (let prop in itemData) {
    if (itemData[prop] === "") {
      itemData[prop] = null;
    }
  }

  itemData.postDate = new Date();

  return Item.create(itemData)
    .then(() => {
      console.log("Item created");
    })
    .catch((err) => {
      throw new Error("Unable to create item");
    });
};

module.exports.getPublishedItems = function () {
  return Item.findAll({
    where: {
      published: true,
    },
  })
    .then((items) => {
      return items;
    })
    .catch((err) => {
      throw new Error("No results returned");
    });
};

module.exports.getPublishedItemsByCategory = function (category) {
  return Item.findAll({
    where: {
      published: true,
      category: category,
    },
  })
    .then((items) => {
      return items;
    })
    .catch((err) => {
      throw new Error("No results returned");
    });
};

module.exports.getCategories = function () {
  return Category.findAll()
    .then((categories) => {
      return categories;
    })
    .catch((err) => {
      throw new Error("No results returned");
    });
};

module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
    for (const prop in categoryData) {
      if (categoryData[prop] === "") {
        categoryData[prop] = null;
      }
    }

    Category.create(categoryData)
      .then(() => {
        resolve("Category created successfully");
      })
      .catch((err) => {
        reject("Unable to create category");
      });
  });
};

module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: {
        id: id,
      },
    })
      .then((rowsDeleted) => {
        if (rowsDeleted === 1) {
          resolve("Category deleted successfully");
        } else {
          reject("Category not found");
        }
      })
      .catch((err) => {
        reject("Unable to delete category");
      });
  });
};

module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: {
        id: id,
      },
    })
      .then((rowsDeleted) => {
        if (rowsDeleted === 1) {
          resolve("Item deleted successfully");
        } else {
          reject("Item not found");
        }
      })
      .catch((err) => {
        reject("Unable to delete item");
      });
  });
};
