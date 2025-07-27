const Bank = require("../model/bank.model");

const bankControl = {
  addBank: async (req, res) => {
    try {
      let data = req.body;
      let newBank = new Bank(data);
      await newBank.save();
      res.status(201).send({
        message: "Bank Details created !!",
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).send({
        message: error.message,
      });
    }
  },
  getAllBankData: async (req, res) => {
    try {
      let data = await Bank.find();
      res.send(data);
    } catch (error) {
      console.log(error.message);
      return res.status(500).send({
        message: error.message,
      });
    }
  },
  updateBankData: async (req, res) => {
    try {
      let data = req.body;
      await Bank.findByIdAndUpdate(data._id, data);
      res.send();
    } catch (error) {
      console.log(error.message);
      return res.status(500).send({
        message: error.message,
      });
    }
  },
  deleteBank: async (req, res) => {
    try {
      let { id } = req.params;
      await Bank.findByIdAndDelete(id);
      res.send();
    } catch (error) {
      console.log(error.message);
      return res.status(500).send({
        message: error.message,
      });
    }
  },
};

module.exports = bankControl;
