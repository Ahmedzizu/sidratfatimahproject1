const {
  expensesValidation,
  drawsValidation,
  paypalValidation,
} = require("../validation/financeValidation");
const getDateToday = require("../middlewares/dateToday");
const {
  Draws,
  Expenses,
  Paypal,
  OnlinePayment,
  BankTransaction,
} = require("../model/finance");
const Reservation = require("../model/reservation");
const ObjectId = require("mongoose").Types.ObjectId;
const ReservationPayments = require("../model/reservationPayments");

const finance = {


  postDraws: async (req, res) => {
    try {
        let { type, amount, note } = req.body;
        let { errors, isValid } = drawsValidation(type, amount);
        if (!isValid) return res.status(403).send({ errors });

        let draws = new Draws({
            type,
            amount,
            date: getDateToday(),
            employee: "غير محدد", // ✅ يمكن وضع قيمة افتراضية أو تركه فارغًا
            note,
        });

        return await draws
            .save()
            .then(() => res.sendStatus(201))
            .catch((error) => {
                console.log(error.message);
                return res.status(400).send({ error: error.message });
            });

    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: error.message });
    }
},

  getDraws: async (req, res) => {
    try {
      let draws = await Draws.find();
      res.send(draws);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  updateDraws: async (req, res) => {
    try {
      let { _id, type, amount, employee, note } = req.body;
      await Draws.findByIdAndUpdate({ _id }, { type, amount, employee, note })
        .then(() => res.send())
        .catch((err) => {
          console.log(err.message);
          res.status(403).send(err.message);
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  deleteDraws: async (req, res) => {
    try {
      let id = req.params.id;
      await Draws.findByIdAndDelete({ _id: id })
        .then(() => res.send())
        .catch((error) => {
          console.log(error.message);
          return res.status(400).send({ error: error.message });
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  postPaypal: async (req, res) => {
    try {
        let { bank, amount, reciver, donater } = req.body;
        let { errors, isValid } = paypalValidation(bank, amount, reciver, donater);
        if (!isValid) return res.status(403).send({ errors });

        let paypal = new Paypal({
            bank,
            amount,
            date: getDateToday(),
            employee: "غير محدد", // ✅ تعيين قيمة افتراضية أو تركه فارغًا
            reciver,
            donater,
        });

        return await paypal
            .save()
            .then(() => res.sendStatus(201))
            .catch((error) => {
                console.log(error.message);
                return res.status(400).send({ error: error.message });
            });

    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: error.message });
    }
},

  getPaypal: async (req, res) => {
    try {
      let paypal = await Paypal.find();
      res.send(paypal);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  updatePaypal: async (req, res) => {
    try {
      let { _id, bank, amount, employee, reciver, donater } = req.body;
      await Paypal.findByIdAndUpdate(
        { _id },
        { bank, amount, employee, reciver, donater }
      )
        .then(() => res.send())
        .catch((err) => {
          console.log(err.message);
          res.status(403).send(err.message);
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  deletePaypal: async (req, res) => {
    try {
      let id = req.params.id;
      await Paypal.findByIdAndDelete({ _id: id })
        .then(() => res.send())
        .catch((error) => {
          console.log(error.message);
          return res.status(400).send({ error: error.message });
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  postOnlinePayment: async (req, res) => {
    try {
        let { bank, amount, reciver, donater } = req.body;
        let { errors, isValid } = paypalValidation(bank, amount, reciver, donater);
        if (!isValid) return res.status(403).send({ errors });

        let onlinePayment = new OnlinePayment({
            bank,
            amount,
            date: getDateToday(),
            employee: "غير محدد", // ✅ تعيين قيمة افتراضية أو تركه فارغًا
            reciver,
            donater,
        });

        return await onlinePayment
            .save()
            .then(() => res.sendStatus(201))
            .catch((error) => {
                console.log(error.message);
                return res.status(400).send({ error: error.message });
            });

    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: error.message });
    }
},
  getOnlinePayment: async (req, res) => {
    try {
      let onlinePayment = await OnlinePayment.find();
      res.send(onlinePayment);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  updateOnlinePayment: async (req, res) => {
    try {
      let { _id, bank, amount, employee, reciver, donater } = req.body;
      console.log(req.body);
      await OnlinePayment.findByIdAndUpdate(
        { _id },
        { bank, amount, employee, reciver, donater }
      )
        .then(() => res.send())
        .catch((err) => {
          console.log(err.message);
          res.status(403).send(err.message);
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  deleteOnlinePayment: async (req, res) => {
    try {
      let id = req.params.id;
      await OnlinePayment.findByIdAndDelete({ _id: id })
        .then(() => res.send())
        .catch((error) => {
          console.log(error.message);
          return res.status(400).send({ error: error.message });
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  postBankTransaction: async (req, res) => {
    try {
        let { bank, amount, reciver, donater } = req.body;
        console.log(bank);

        let { errors, isValid } = paypalValidation(bank, amount, reciver, donater);
        if (!isValid) return res.status(403).send({ errors });

        let bankTransaction = new BankTransaction({
            bank,
            amount,
            date: getDateToday(),
            employee: "غير محدد", // ✅ تعيين قيمة افتراضية أو تركه فارغًا
            reciver,
            donater,
        });

        return await bankTransaction
            .save()
            .then(() => res.sendStatus(201))
            .catch((error) => {
                console.log(error.message);
                return res.status(400).send({ error: error.message });
            });

    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: error.message });
    }
},
  getBankTransaction: async (req, res) => {
    try {
      let bankTransaction = await BankTransaction.find();
      res.send(bankTransaction);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  updateBankTransaction: async (req, res) => {
    try {
      let { _id, bank, amount, employee, reciver, donater } = req.body;
      console.log(req.body);
      await BankTransaction.findByIdAndUpdate(
        { _id },
        { bank, amount, employee, reciver, donater }
      )
        .then(() => res.send())
        .catch((err) => {
          console.log(err.message);
          res.status(403).send(err.message);
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
  deleteBankTransaction: async (req, res) => {
    try {
      let id = req.params.id;
      await BankTransaction.findByIdAndDelete({ _id: id });
      res.send()
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: error.message });
    }
  },
};

module.exports = finance;
