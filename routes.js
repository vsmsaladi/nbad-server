
const express = require("express");
const jwt = require('jsonwebtoken')
const { expressjwt: exjwt } = require('express-jwt');
const bcrypt = require('bcryptjs')
const mysql = require("mysql");

const User = require("./Models/Users");
const route = express.Router();

const secretKey = "My Secret Key";
const jwtMW = exjwt({
  secret: secretKey,
  algorithms: ['HS256'],
});

require('dotenv').config();

var connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: 3306
});


const verifyToken = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.slice(7);
    try {
      const decodedToken = jwt.verify(token, secretKey);
      req.user = decodedToken; 
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};











route.post("/app/signup", (req, res) => {



  const encrypted_password = bcrypt.hashSync(req.body.password, 10);

  var query1 = `SELECT * FROM Users WHERE email = ?`
  var query2 = `SELECT * FROM Users WHERE username = ?`




  var query = `INSERT INTO Users SET ?`;
  var user = new User(req.body);
  user.password = encrypted_password;


  connection.query(
    query1,
    [user.email],
    (err, results, fields) => {
      if (err) {
        console.log(err);
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(201).json({ message: "Email is already registered, Please Login" })
        }
        else {
          connection.query(
            query2,
            [user.username],
            (err, results, fields) => {
              if (err) {
                res.status(401).json({ error: err.message })
              }
              else {
                if (results.length > 0) {
                  res.status(201).json({ message: "Username is already taken" })
                }
                else {
                  connection.query(
                    query,
                    user,
                    (err, results, fields) => {
                      if (err) {
                        res.status(400).json({ error: err.message })
                      }
                      else {
                        var token = jwt.sign(user.getUser(), secretKey);
                        res.status(200).json({ message: "Signup Successful", token: token });
                      }
                    }
                  );
                }
              }
            }
          )
        }
      }
    }
  )



})

route.post("/app/login", (req, res) => {

  const { username, password } = req.body;

  var query = `SELECT * FROM Users WHERE username = ? OR email = ?`

  connection.query(
    query,
    [username, username],
    (err, results, fields) => {
      if (err) {
        res.status(500).json({ message: 'Internal Server Error' });
      }
      else {
        if (results.length > 0) {
          var user = new User(results[0])
          if (bcrypt.compareSync(password, user.password)) {
            var token = jwt.sign(user.getUser(), secretKey);
            res.status(200).json({ message: "Login Successful", token: token });
          }
          else {
            res.status(201).json({ message: "Incorrect Password" })
          }
        }
        else {
          res.status(202).json({ message: "User Not Found" })
        }

      }
    }
  );
})

route.get("/app/logout", verifyToken, (req, res) => {

})

route.get("/app/userProfile", verifyToken, (req, res) => {

  if (req.user != null) {
    res.status(200).json({ message: "User profile Retrieved successfully", userProfile: req.user })
  }
  else {
    res.status(400).json({ message: "User is not logged in" })
  }

})

TODO:
route.put("/app/userDetails", verifyToken, (req, res) => {


  var query = `UPDATE Users SET firstName = ?, lastName = ?, username=?, email=?, gender=?, mobile=?  where id= ${req.body.id}`;
  var values = [req.body.firstName, req.body.lastName, req.body.username, req.body.email, req.body.gender, req.body.mobile]
  var user = new User(req.body);


  connection.query(
    query,
    values,
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        var token = jwt.sign(user.getUser(), secretKey);

        res.status(200).json({ message: "Update Successful", token: token, userProfile: user });
      }
    }
  );

})




route.get("/app/userBudget", verifyToken, (req, res) => {


  const user_id = req.user.id;


  const query = `SELECT * FROM budgets WHERE user_id = ?`
  connection.query(
    query,
    [user_id],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(200).json({ message: "Budgets Retrieved Successfully", budgets: results })
        }
        else {
          res.status(201).json({ message: "No Budgets Available for the user" })
        }

      }
    }
  );
})

route.get("/app/userConfigureBudgets", verifyToken, (req, res) => {

  const user_id = req.user.id;


  const query = `SELECT * FROM configure WHERE user_id = ?`
  connection.query(
    query,
    [user_id],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(200).json({ message: "Budgets Retrieved Successfully", budgets: results })
        }
        else {
          res.status(201).json({ message: "No Budgets Available for the user" })
        }

      }
    }
  );
})

route.get("/app/userExpenses", verifyToken, (req, res) => {



  const user_id = req.user.id;


  const query = `SELECT * FROM expenses WHERE user_id = ?`
  connection.query(
    query,
    [user_id],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(200).json({ message: "Budgets Retrieved Successfully", expenses: results })
        }
        else {
          res.status(201).json({ message: "No Budgets Available for the user" })
        }

      }
    }
  );
})

route.post("/app/userConfigureBudgets", verifyToken, (req, res) => {

  const user_id = req.user.id;

  const query = `SELECT * FROM configure WHERE user_id = ? and item = ? and category = ?`
  connection.query(
    query,
    [user_id, req.body.item, req.body.category],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(201).json({ message: "Budgets for item - " + req.body.item + " already present" })
        }
        else {
          const budgetQuery = `INSERT INTO configure SET ?`
          var budgetData = {
            user_id: user_id,
            category: req.body.category,
            item: req.body.item,
            budget: req.body.budget
          }
          connection.query(
            budgetQuery,
            budgetData,
            (err, results, fields) => {
              if (err) {
                res.status(400).json({ error: err.message })
              }
              else {
                res.status(200).json({ message: "Updated budget", budgets: results })
              }
            }
          )
        }

      }
    }
  );



})

route.post("/app/userExpenses", verifyToken, (req, res) => {

  const user_id = req.user.id;

  const query = `SELECT * FROM expenses WHERE user_id = ? and item = ? and category = ?`
  connection.query(
    query,
    [user_id, req.body.item, req.body.category],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(201).json({ message: "Budgets for item - " + req.body.item + " already present" })
        }
        else {
          const budgetQuery = `INSERT INTO configure SET ?`
          var budgetData = {
            user_id: user_id,
            category: req.body.category,
            item: req.body.item,
            budget: req.body.budget,
            month: req.body.month,
            expense: req.body.expense
          }
          connection.query(
            budgetQuery,
            budgetData,
            (err, results, fields) => {
              if (err) {
                res.status(400).json({ error: err.message })
              }
              else {
                res.status(200).json({ message: "Updated budget", expenses: results })
              }
            }
          )
        }

      }
    }
  );



})

route.get("/app/userMonthlyBudget", verifyToken, (req, res) => {



  const user_id = req.user.id;

  const query = `SELECT * FROM monthlybudgets WHERE user_id = ?`
  connection.query(
    query,
    [user_id],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(200).json({ message: "Budgets Retrieved Successfully", budgets: results })
        }
        else {
          res.status(201).json({ message: "No Budgets Available for the user" })
        }

      }
    }
  );


})

route.get("/app/userMonthlyBudget/:year", verifyToken, (req, res) => {


  const user_id = req.user.id;
  const year = req.params.year;


  const query = `SELECT * FROM monthlybudgets WHERE user_id = ? AND year = ?`
  connection.query(
    query,
    [user_id, year.trim()],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(200).json({ message: "Budgets For Month Retrieved Successfully", budgets: results })
        }
        else {
          res.status(201).json({ message: "No Budgets Available for the user" })
        }

      }
    }
  );


})

route.get("/app/userMonthlyBudget/:month/:year", verifyToken, (req, res) => {


  const month = req.params.month;
  const user_id = req.user.id;
  const year = req.params.year;


  const query = `SELECT * FROM monthlybudgets WHERE user_id = ? AND month= ? AND year = ?`
  connection.query(
    query,
    [user_id, month.trim(), year.trim()],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(200).json({ message: "Budgets For Month Retrieved Successfully", budgets: results })
        }
        else {
          res.status(201).json({ message: "No Budgets Available for the user" })
        }

      }
    }
  );


})

route.post("/app/userBudget", verifyToken, (req, res) => {

  const user_id = req.user.id;

  const query = `SELECT * FROM budgets WHERE user_id = ? and item = ?`
  connection.query(
    query,
    [user_id, req.body.item],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(201).json({ message: "Budgets for item - " + req.body.item + " already present" })
        }
        else {
          const budgetQuery = `INSERT INTO Budgets SET ?`
          var budgetData = {
            user_id: user_id,
            item: req.body.item,
            budget: req.body.budget
          }
          connection.query(
            budgetQuery,
            budgetData,
            (err, results, fields) => {
              if (err) {
                res.status(400).json({ error: err.message })
              }
              else {
                res.status(200).json({ message: "Updated budget", budgets: results })
              }
            }
          )
        }

      }
    }
  );



})

route.post("/app/userMonthlyBudget", verifyToken, (req, res) => {



  const user_id = req.user.id;

  const query = `SELECT * FROM monthlybudgets WHERE user_id = ? and month = ? and year = ? and item = ?`
  connection.query(
    query,
    [user_id, req.body.month, req.body.year, req.body.item],
    (err, results, fields) => {
      if (err) {
        res.status(400).json({ error: err.message })
      }
      else {
        if (results.length > 0) {
          res.status(201).json({ message: "Budgets for item - " + req.body.item + " already present" })
        }
        else {
          const budgetQuery = `INSERT INTO monthlybudgets SET ?`
          var budgetData = {
            user_id: user_id,
            month: req.body.month,
            year: req.body.year,
            item: req.body.item,
            estimatedbudget: req.body.estimatedbudget,
            actualbudget: req.body.actualbudget
          }
          connection.query(
            budgetQuery,
            budgetData,
            (err, results, fields) => {
              if (err) {
                res.status(400).json({ error: err.message })
              }
              else {
                res.status(200).json({ message: "Updated budget monthly", budgets: results })
              }
            }
          )
        }

      }
    }
  );

})

route.put("/app/userConfigureBudgets", verifyToken, (req, res) => {


  const configure_id = req.body.configure_id;
  const updated_data = {
    user_id: req.user.id,
    category: req.body.category,
    item: req.body.item,
    budget: req.body.budget
  }
  const query = `UPDATE configure SET ? where configure_id = ${configure_id}`
  connection.query(
    query,
    [updated_data],
    (err, result, fields) => {
      if (err) {
        res.status(400).json({ error: err.message });
      }
      else {
        res.status(200).json({ message: "Updated budget successfully" });
      }
    }

  )

})


route.put("/app/userBudget", verifyToken, (req, res) => {


  const budget_id = req.body.budget_id;
  const updated_data = {
    user_id: req.user.id,
    item: req.body.item,
    budget: req.body.budget
  }
  const query = `UPDATE budgets SET ? where budget_id = ${budget_id}`
  connection.query(
    query,
    [updated_data],
    (err, result, fields) => {
      if (err) {
        res.status(400).json({ error: err.message });
      }
      else {
        res.status(200).json({ message: "Updated budget successfully" });
      }
    }

  )

})

route.put("/app/userMonthlyBudget", verifyToken, (req, res) => {
  const monthlyBudget_id = req.body.budget_id;
  const updated_data = {
    item: req.body.item,
    month: req.body.month,
    year: req.body.year,
    estimatedbudget: req.body.estimatedbudget,
    actualbudget: req.body.actualbudget
  }
  const query = `UPDATE monthlybudgets SET ? where monthlybudget_id = ${monthlyBudget_id}`
  connection.query(
    query,
    [updated_data],
    (err, result, fields) => {
      if (err) {
        res.status(400).json({ error: err.message });
      }
      else {
        res.status(200).json({ message: "Updated budget successfully" });
      }
    }

  )

})

route.delete("/app/userBudget", verifyToken, (req, res) => {

  const budget_id = req.body.budget_id;
  const query = `DELETE FROM budgets where budget_id = ${budget_id}`
  connection.query(
    query,
    (err, result, fields) => {
      if (err) {
        res.status(400).json({ error: err.message });
      }
      else {
        res.status(200).json({ message: "Deleted budget successfully" });
      }
    }

  )



})

route.post('/app/refreshToken', verifyToken, (req, res) => {
  const user = req.user;
  const filteredObject = Object.entries(user).reduce((acc, [key, value]) => {
    if (key !== 'iat' && key !== 'exp') {
      acc[key] = value;
    }
    return acc;
  }, {});
  const newUser = new User(filteredObject);
  const newToken = jwt.sign(newUser.getUser(), secretKey, { expiresIn: '1m' });

  res.json({ token: newToken });
});

route.delete("/app/userMonthlyBudget", verifyToken, (req, res) => {


  const monthlyBudget_id = req.body.monthlyBudget_id;

  const query = `DELETE FROM monthlybudgets where monthlybudget_id = ${monthlyBudget_id}`
  connection.query(
    query,
    (err, result, fields) => {
      if (err) {
        res.status(400).json({ error: err.message });
      }
      else {
        res.status(200).json({ message: "Deleted monthly budget successfully" });
      }
    }

  )

})

module.exports = route;









