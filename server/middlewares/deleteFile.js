const Chalet = require("../model/chalet");
const Hall = require("../model/hall");
const Resort = require("../model/resort");
const fs = require('fs');
const path = require('path');
const User = require("../model/user");
const { promises: fsPromises } = require('fs'); // ✅ This is correct

const deleteFile = {
  chalet: async (req, res, nxt) => {
    try {
      let chalets = await Chalet.findById(req.params.id);
      if (!chalets) {
        return res.status(404).send({ message: `Chalet with ID ${req.params.id} not found.` });
      }
      for (const ele of chalets.images) {
        const parts = ele.split('/');
        const fileName = parts[parts.length - 1];
        if (!fileName || fileName === 'undefined') continue;
        const filePath = path.join(path.dirname(__dirname), 'uploads', 'chalet', fileName);
        try {
          await fsPromises.unlink(filePath);
          console.log(`✅ Chalet file deleted successfully: ${filePath}`);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error(`❌ Error deleting chalet file ${filePath}:`, err.message);
          }
        }
      }
      nxt();
    } catch (error) {
      console.error("❌ General error in chalet deletion middleware:", error.message);
      return res.status(500).send({ message: "Internal server error during chalet file deletion." });
    }
  },
  hall: async (req, res, nxt) => {
    try {
      let halls = await Hall.findById(req.params.id);
      if (!halls) {
        return res.status(404).send({ message: `Hall with ID ${req.params.id} not found.` });
      }
      for (const ele of halls.images) {
        const parts = ele.split('/');
        const fileName = parts[parts.length - 1];
        if (!fileName || fileName === 'undefined') continue;
        const filePath = path.join(path.dirname(__dirname), 'uploads', 'hall', fileName);
        try {
          await fsPromises.unlink(filePath);
          console.log(`✅ Hall file deleted successfully: ${filePath}`);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error(`❌ Error deleting hall file ${filePath}:`, err.message);
          }
        }
      }
      nxt();
    } catch (error) {
      console.error("❌ General error in hall deletion middleware:", error.message);
      return res.status(500).send({ message: "Internal server error during file deletion." });
    }
  },
  // ✅ Corrected resort function
  resort: async (req, res, nxt) => {
    try {
      let resorts = await Resort.findById(req.params.id);
      if (!resorts) {
        return res.status(404).send({ message: `Resort with ID ${req.params.id} not found.` });
      }
      for (const ele of resorts.images) {
        const parts = ele.split('/');
        const fileName = parts[parts.length - 1];
        if (!fileName || fileName === 'undefined') continue;
        const filePath = path.join(path.dirname(__dirname), 'uploads', 'resort', fileName);
        try {
          await fsPromises.unlink(filePath);
          console.log(`✅ Resort file deleted successfully: ${filePath}`);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error(`❌ Error deleting resort file ${filePath}:`, err.message);
          }
        }
      }
      nxt();
    } catch (error) {
      console.error("❌ General error in resort deletion middleware:", error.message);
      return res.status(500).send({ message: "Internal server error during file deletion." });
    }
  },
  // ✅ Corrected user function
  user: async (req, res, nxt) => {
    try {
      if (!req.files || !req.user) return nxt(); // Check for user as well
      let user = await User.findById(req.user._id);
      if (!user || !user.image) return nxt(); // Check for user and image
      
      const parts = user.image.split('/');
      const fileName = parts[parts.length - 1];
      if (!fileName || fileName === 'undefined') return nxt();

      const filePath = path.join(path.dirname(__dirname), 'uploads', 'user', fileName);
      try {
        await fsPromises.unlink(filePath);
        console.log(`✅ User file deleted successfully: ${filePath}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`❌ Error deleting user file ${filePath}:`, err.message);
        }
      }
      nxt();
    } catch (error) {
      console.error("❌ General error in user deletion middleware:", error.message);
      return res.status(500).send({ message: "Internal server error during file deletion." });
    }
  },
}
module.exports = deleteFile;