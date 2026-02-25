const express = require('express');
const router = express.Router();
const controllers = require("../controller/")

// home page
router.get("/home", controllers.getHome);
router.post("/search", controllers.postSearch);

// Connect page
router.get("/connect", controllers.getConnect);
router.post("/login", controllers.postLogin);
router.post("/register", controllers.postRegister);

// game page
router.get("/game/:id", controllers.getGame);
router.post("/game/add/eval", controllers.postEval);
router.post("/game/add/comment", controllers.postComment);

// profil page
router.get("/profil/:id", controllers.getProfil);
router.post("/profil/add/like/game", controllers.postLikeGame);
router.post("/profil/del", controllers.postDelAccompt);

module.exports = router
