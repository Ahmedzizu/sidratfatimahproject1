const { format } = require("date-fns");
const ReservationServices = require("../model/reservationServices");

const reservationService = {
  postService: async (req, res) => {
    try {
      let service = new ReservationServices({
        ...req.body,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      await service.save();
      res.send();
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },
  getService: async (req, res) => {
    try {
      let service = await ReservationServices.find({
        reservationId: req.params.id,
      });
      res.send(service);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },
  updateService: async (req, res) => {
    try {
      await ReservationServices.findByIdAndUpdate(req.body._id, req.body)
        .then((result) => {
          res.send();
        })
        .catch((error) => {
          console.log(error.message);
          res.status(500).send({ message: error.message });
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },
  deleteService: async (req, res) => {
    try {
      await ReservationServices.findByIdAndDelete(req.params.id)
        .then(() => res.send())
        .catch((error) => {
          console.log(error.message);
          res.status(500).send({ message: error.message });
        });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },
  getAllService: async (req, res) => {
    try {
      let service = await ReservationServices.find({});
      res.send(service);
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },
};
module.exports = reservationService;
