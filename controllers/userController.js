const { create, getUsers, getUserByUserId, updateUser, deleteUser } = require("../models/userManagModel");

const { genSaltSync, hashSync, compareSync } = require("bcrypt");
const { sign } = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const userManagModel = require("../models/userManagModel");
const userValidation = require("../controllers/validation/userValidation");

module.exports = 
{
  createUser : (req,res) => {
      const body = req.body;
      const salt = genSaltSync(10);
      console.log("body=",body,"salt = ",salt);
      body.password = hashSync(body.password, salt);
      create(body, (err, results) => {
          if (err) {
              console.log(err);
              return res.status(500).json({
                  success: 0,
                  message: "database connection error"
              });
          }
          return res.status(200).json({
              success: 1,
              data: results
          });
      });
  },
  getUsers : (req,res) => {
      getUsers((err, results) => {
          if (err) {
              console.log(err);
              return;
          }
          return res.json({
              success: 1,
              data: results
          });
      });
  },
  getUserByUserId : (req,res) => {
      const id = req.params.id;
      getUserByUserId(id, (err, results) => {
          if (err) {
              console.log(err);
              return;
          }
          if (!results) {
              return res.json({
                  success: 0,
                  message: "record not found"
              });
          }
          return res.json({
              success: 1,
              data: results
          });
      });
  },
  updateUser : (req, res)=> {
      const body = req.body;
      const salt = genSaltSync(10);
      body.password = hashSync(body.password,salt);
      updateUser(body, (err, results) => {
          if (err) {
              console.log(err);
              return;
          }
          return res.json({
              success:1,
              message: "updated successfully"
          });
      });
  },
  deleteUser : (req,res) => {
      const data = req.body;
      deleteUser(data, (err, results) => {
          if (err) {
              console.log(err);
              return;
          }
          if (!results) {
              return res.json({
                  success: 0,
                  message: "record not found"
              });
          }
          return res.json({
              success: 1,
              data: "user deleted successfully"
          });
      });
  },
};