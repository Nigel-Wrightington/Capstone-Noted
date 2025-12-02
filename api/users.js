import express from "express";
import { createUser, getUserByUsernameAndPassword } from "#db/queries/users"; // For registeration -- lauren //
import requireBody from "#middleware/requireBody";
import requireUser from "#middleware/requireUser";
import { createToken } from "#utils/jwt";

const router = express.Router();

// Lauren // Register // check remove if not needed for this vertical slice//
router
  .route("/register")
  .post(requireBody(["username", "password"]), async (req, res) => {
    const { username, password } = req.body;
    const user = await createUser(username, password);

    const token = await createToken({ id: user.id });
    res.status(201).send(token);
  });

// LOGIN VERTICAL SLICE // LOGOUT SLICE WOULD BE DELETING THE TOKEN FROM FRONTEND -- SHERIN //
// If an invalid username or password thenm response error 401 //
// REQUIRE BODY USERS/ME FOR FRONTEND NAVBAR //

router.post(
  "/login",
  requireBody(["username", "password"]),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const user = await getUserByUsernameAndPassword(username, password);
      if (!user) {
        return res.status(401).send("Invalid username or password.");
      }

      const token = await createToken({ id: user.id });
      res.send({ token });
    } catch (err) {
      next(err);
    }
  }
);

// /me to identify current logged in users & for frontend Navbar use //
router.get("/me", requireUser, (req, res) => {
  res.send(req.user);
});

export default router;
