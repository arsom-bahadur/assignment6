const express = require("express");
const itemData = require("./store-service");
const clientSessions = require("client-sessions");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const authData = require("./auth-service");
const exphbs = require("express-handlebars");

cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: "",
  secure: true,
});

const upload = multer();

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  clientSessions({
    cookieName: "session",
    secret: "kneerosehosting_69420XdLOLyousuck",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  })
);

app.use(function (req, res, next) {
  let route = req.path.substring(1);

  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));

  app.locals.viewingCategory = req.query.category;

  next();
});

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url == app.locals.activeRoute
            ? ' class="nav-link active" '
            : ' class="nav-link" ') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      },
    },
  })
);

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.set("view engine", ".hbs");

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await itemData.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    let item = items[0];

    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await itemData.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.get("/items", ensureLogin, (req, res) => {
  let queryPromise = null;

  if (req.query.category) {
    queryPromise = itemData.getItemsByCategory(req.query.category);
  } else if (req.query.minDate) {
    queryPromise = itemData.getItemsByMinDate(req.query.minDate);
  } else {
    queryPromise = itemData.getAllItems();
  }

  queryPromise
    .then((data) => {
      if (data.length > 0) {
        res.render("items", { items: data });
      } else {
        res.render("items", { message: "no results" });
      }
    })
    .catch((err) => {
      res.render("items", { message: "no results" });
    });
});

app.get("/items/add", ensureLogin, (req, res) => {
  res.render("addItem");
});

app.post(
  "/items/add",
  ensureLogin,
  upload.single("featureImage"),
  async (req, res) => {
    try {
      let categories = await itemData.getCategories();

      if (req.file) {
        let streamUpload = (req) => {
          return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream((error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            });

            streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
        };

        async function upload(req) {
          let result = await streamUpload(req);
          console.log(result);
          return result;
        }

        upload(req).then((uploaded) => {
          processItem(uploaded.url);
        });
      } else {
        processItem("");
      }

      function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        itemData
          .addItem(req.body)
          .then((post) => {
            res.redirect("/items");
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    } catch (error) {
      res.render("addPost", { categories: [] });
    }
  }
);

app.get("/item/:id", ensureLogin, (req, res) => {
  itemData
    .getItemById(req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get("/categories", ensureLogin, (req, res) => {
  itemData
    .getCategories()
    .then((data) => {
      if (data.length > 0) {
        res.render("categories", { categories: data });
      } else {
        res.render("categories", { message: "no results" });
      }
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});

app.get("/shop/:id", ensureLogin, async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await itemData.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    viewData.item = await itemData.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await itemData.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  itemData
    .addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  itemData
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.get("/items/delete/:id", ensureLogin, (req, res) => {
  itemData
    .deletePostById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const userData = req.body;

  authData
    .registerUser(userData)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: userData.userName,
      });
    });
});

app.post("/login", (req, res) => {
  const userData = req.body;
  userData.userAgent = req.get("User-Agent");

  authData
    .checkUser(userData)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };

      res.redirect("/items");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: userData.userName });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.use((req, res) => {
  res.status(404).render("404");
});

itemData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT);
    });
  })
  .catch(function (err) {
    console.log("unable to start server: " + err);
  });
