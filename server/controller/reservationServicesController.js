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
      res.status(201).send(service);
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

  // ✨ This function has been corrected ✨
  updateService: async (req, res) => {
    try {
      // 1. Get the service ID from the URL parameters
      const serviceId = req.params.id;
      // 2. Get the new data from the request body
      const updateData = req.body;

      const updatedService = await ReservationServices.findByIdAndUpdate(serviceId, updateData, { new: true });

      if (!updatedService) {
        return res.status(404).send({ message: "Service not found." });
      }

      res.status(200).send(updatedService);

    } catch (error) {
      console.log(error.message);
      res.status(500).send({ message: error.message });
    }
  },

  deleteService: async (req, res) => {
    try {
      const deletedService = await ReservationServices.findByIdAndDelete(req.params.id);
      
      if (!deletedService) {
          return res.status(404).send({ message: "Service not found." });
      }

      res.status(200).send({ message: "Service deleted successfully." });
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