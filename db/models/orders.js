const { all } = require("../../routes/menuRouter.js");
const mongoose = require("../db.js");
const MenuItems = require("./menuItems.js");

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  items: [
    {
      item: {
        type: mongoose.Schema.ObjectId,
        ref: "MenuItems"
      },

      quantity: {
        type: Number,
        required: true
      }
    }
  ],
  status: {
    type: String,
    required: true,
    enum: ["pending", "confirmed", "delivered", "cancelled"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
orderSchema.set("toJSON", {
  virtuals: true
});
orderSchema.statics.calcTotal = (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

// order model
const Order = mongoose.model("Order", orderSchema);

const getAll = async () => {
  // populate each item
  const orders = await Order.find().populate("items.item");

  return orders;
};

const getOne = async (id) => {
  const order = await Order.findById(id).populate("items.item");
  return order;
};

const create = async (body) => {
  const order = await Order.create(body);
  console.log(body);
  return order;
};

const update = async (id, body) => {
  const order = await Order.findByIdAndUpdate(id, body, { new: true });
  return order;
};

const remove = async (id) => {
  const order = await Order.findByIdAndDelete(id);
  return order.id;
};

const getByStatus = async (status) => {
  const orders = await Order.find({ status }).populate("items");
  return orders;
};

const getTotalSales = async () => {
  const calculateTotalPrice = () => {
    let totalSales = 0;
    Order.find({
      $or: [{ status: "delivered" }, { status: "pending" }]
    }).then((orders) => {
      for (let i = 0; i < orders.length; i += 1) {
        for (let j = 0; j < orders[i].items.length; j += 1) {
          // const calculateTotalPrice = async () => {
          MenuItems.getOne(orders[i].items[j].item.toString()).then((item) => {
            const itemTotalPrice = item.price * orders[i].items[j].quantity;
            totalSales += itemTotalPrice;
            console.log(totalSales);
          });
        }
      }
    });
    return { total: totalSales };
  };
  await calculateTotalPrice();
};

const getByOrderStatus = async (query) => {
  try {
    const orders = await Order.find({
      $or: [{ status: { $regex: query } }]
    });
    return orders;
  } catch (error) {
    return error;
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
  getByStatus,
  getTotalSales,
  getByOrderStatus,
  Order
};
