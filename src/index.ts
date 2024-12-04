import express, { Request, Response } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import User from "./user";
import Product from "./product";
import { Uploadfile } from "./upload";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import category from "./danhmuc";
import Order from "./OrderModel";
import Statistic from "./statistic";
var cors = require("cors");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const app = express();
const { uploadPhoto } = require("./middleware/uploadImage.js");
const PORT = process.env.PORT || 28017;

const {
  cloudinaryUploadImg,
  cloudinaryDeleteImg,
} = require("./utils/Cloudinary");
const JWT_SECRET = process.env.JWT_SECRET as string;

// Mở rộng kiểu cho Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

// Kết nối MongoDB
mongoose
  .connect("mongodb+srv://hoalacanh2508:FnXN4Z9PhHQdRbcv@cluster0.x6cjq.mongodb.net/DATN_ToyStoryShop", {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Kết nối DB thành công");
  })
  .catch((err) => {
    console.log("Lỗi kết nối DB:", err);
  });

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Endpoint GET: Lấy tất cả người dùng
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng" });
  }
});

// Đăng nhập
app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: process.env.EXPIRES_TOKEN,
    });
    res.json({
      info: email,
      token: token,
      expiresIn: process.env.EXPIRES_TOKEN,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
  }
});



// Lấy thông tin sản phẩm
app.get("/product", async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
  }
});
// Lấy thông tin sản phẩm chi tiết theo ID
app.get("/product/details/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("Requested Product ID:", id);  // Log ID nhận được từ frontend
    const product = await Product.findById(id).populate("cateId").exec();
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin chi tiết sản phẩm" });
  }
});

// Lấy danh mục
app.get("/category", async (req: Request, res: Response) => {
  try {
    const categories = await category.find();
    res.json(categories);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin danh mục" });
  }
});
// Lấy thông tin sản phẩm theo ID
app.get("/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin sản phẩm" });
  }
});
// Lấy thông tin danh mục theo ID
app.get("/category/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Category = await category.findById(id);
    res.json(Category);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin danh mục" });
  }
});

// Cập nhật danh mục
app.put("/updatecategory/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateCategory = await category.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateCategory);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi cập nhật danh mục" });
  }
});

// Tạo mới người dùng
app.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({
      message: "Thêm người dùng thành công",
      user: newUser,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tạo người dùng mới" });
  }
});

// Thêm sản phẩm mới
app.post("/product/add", async (req: Request, res: Response) => {
  try {
    // Log dữ liệu nhận được
    console.log("Request Body:", req.body);

    const { statusPro, price, desPro, creatDatePro, quantity, listPro, imgPro, namePro, cateId, brand, import_price } = req.body;
    const owerId = req.body.owerId || req.user?.id;

    if (!owerId) {
      return res.status(400).json({
        message: "owerId là bắt buộc",
        status: 400,
      });
    }

    // Tạo sản phẩm mới
    const newProduct = new Product({
      owerId,
      statusPro,
      price,
      desPro,
      creatDatePro,
      quantity,
      listPro,
      imgPro,
      namePro,
      cateId,
      brand,
      import_price
    });

    // Lưu sản phẩm vào cơ sở dữ liệu
    await newProduct.save();

    res.status(201).json({
      message: "Thêm sản phẩm thành công",
      product: newProduct,
      status: 200,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: "Lỗi thêm mới", error: error.message });
    } else {
      res.status(500).json({ message: "Lỗi không xác định" });
    }
  }
});


// Thêm danh mục mới
app.post("/addcategory", async (req: Request, res: Response) => {
  try {
    const newCategory = new category(req.body);
    await newCategory.save();
    res.status(201).json({
      message: "Thêm danh mục thành công",
      category: newCategory,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi thêm mới danh mục" });
  }
});

// Upload hình ảnh
app.post(
  "/upload",
  uploadPhoto.array("images", 10),
  async (req: any, res: any) => {
    try {
      const uploader = (path: any) => cloudinaryUploadImg(path);
      const urls = [];
      const files = req.files;
      for (const file of files) {
        const { path } = file;
        const newpath = await uploader(path);
        urls.push(newpath);
        fs.unlinkSync(path);
      }
      res.status(201).json({
        payload: urls,
        status: 200,
      });
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

// Cập nhật thông tin người dùng
app.put("/user/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật thông tin người dùng" });
  }
});

// Cập nhật sản phẩm
app.put("/update/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;  // Lấy id từ params
    const updateProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updateProduct);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm" });
  }
});


// Xóa người dùng
app.delete("/user/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "Người dùng đã được xóa thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi xóa người dùng" });
  }
});

// Xóa danh mục
app.delete("/category/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await category.findByIdAndDelete(id);
    res.json({
      message: "Danh mục đã được xóa thành công",
      id: id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi khi xóa danh mục" });
  }
});

// Xóa sản phẩm
app.delete("/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const test = await Product.findByIdAndDelete(id);

    res.json({
      message: "Sản phẩm đã được xóa thành công",
      id: id,
      test: test,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "lỗi khi xóa sản phẩm" });
  }
});


//quản lí đơn hàng


app.get("/orders", async (req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "prodDetails.prodId", // Đường dẫn tới bảng Product
        select: "namePro", // Chỉ lấy trường namePro từ Product
      });

    res.json(orders);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server, không thể lấy danh sách đơn hàng" });
  }
});




app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );
    if (updatedOrder) {
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái", error });
  }
});



//Thống kê doanh thu

//Thêm mới dữ liệu thống kê
app.post('/statistics/add', async (req, res) => {
  try {
    const { namePro, import_price, price, creatDatePro, quantity, profit } = req.body;

    console.log("Dữ liệu nhận được:", req.body); // Kiểm tra dữ liệu

    // Kiểm tra dữ liệu đầu vào
    if (!namePro || !import_price || !price || !creatDatePro || !quantity || profit == null) {
      return res.status(400).json({ message: "Tất cả các trường đều bắt buộc" });
    }

    // Tạo một bản ghi mới
    const newStatistic = new Statistic({
      namePro,
      import_price,
      price,
      creatDatePro: new Date(creatDatePro), // Chuyển đổi sang định dạng Date
      quantity,
      profit,
    });

    // Lưu vào cơ sở dữ liệu
    await newStatistic.save();
    res.status(201).json({ message: "Thống kê đã được thêm thành công", data: newStatistic });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Đã xảy ra lỗi không xác định" });
    }
  }
});

app.post('/statistics/add', async (req, res) => {
  try {
    const { namePro, import_price, price, creatDatePro, quantity, profit } = req.body;

    console.log("Dữ liệu nhận được:", req.body); // Kiểm tra dữ liệu

    // Kiểm tra dữ liệu đầu vào
    if (!namePro || !import_price || !price || !creatDatePro || !quantity || profit == null) {
      return res.status(400).json({ message: "Tất cả các trường đều bắt buộc" });
    }

    // Tạo một bản ghi mới
    const newStatistic = new Statistic({
      namePro,
      import_price,
      price,
      creatDatePro: new Date(creatDatePro), // Chuyển đổi sang định dạng Date
      quantity,
      profit,
    });

    // Lưu vào cơ sở dữ liệu
    await newStatistic.save();
    res.status(201).json({ message: "Thống kê đã được thêm thành công", data: newStatistic });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Đã xảy ra lỗi không xác định" });
    }
  }
});



//API Thống kê theo ngày:
app.get("/statistics/today", async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0)); // 00:00:00
    const endOfToday = new Date(today.setHours(23, 59, 59, 999)); // 23:59:59

    const stats = await Statistic.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalQuantity: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
        },
      },
    ]);

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// API Thống kê theo tuần
app.get("/statistics/weekly", async (req, res) => {
  try {
    const { weekStart } = req.query;
    const startOfWeek = new Date(String(weekStart)); // Chuyển đổi sang string nếu cần
    const endOfWeek = new Date(String(weekStart));
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const stats = await Statistic.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfWeek, $lte: endOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalQuantity: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// API Thống kê theo tháng
app.get("/statistics/monthly", async (req, res) => {
  try {
    const { year, month } = req.query;
    const yearNum = Number(year);  // Chuyển year thành number
    const monthNum = Number(month);  // Chuyển month thành number

    // Kiểm tra nếu giá trị là NaN, gán giá trị mặc định
    if (isNaN(yearNum) || isNaN(monthNum)) {
      return res.status(400).json({ message: "Invalid year or month" });
    }

    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const stats = await Statistic.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalQuantity: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// API Thống kê theo năm
app.get("/statistics/yearly", async (req, res) => {
  try {
    const { year } = req.query;
    const yearNum = Number(year);  // Chuyển year thành number

    if (isNaN(yearNum)) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const startOfYear = new Date(yearNum, 0, 1);
    const endOfYear = new Date(yearNum, 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    const stats = await Statistic.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalQuantity: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
        },
      },
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// API Thống kê hôm qua:
app.get("/statistics/yesterday", async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Trừ đi 1 ngày
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0)); // 00:00:00
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999)); // 23:59:59

    const stats = await Statistic.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfYesterday, $lte: endOfYesterday },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalQuantity: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
        },
      },
    ]);

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});


///API Thống kê 1 tuần trước:
app.get("/statistics/last-week", async (req, res) => {
  try {
    const today = new Date();
    const lastWeekStart = new Date(today.setDate(today.getDate() - 7)); // Trừ đi 7 ngày
    const startOfLastWeek = new Date(lastWeekStart.setHours(0, 0, 0, 0)); // 00:00:00
    const endOfLastWeek = new Date(lastWeekStart.setHours(23, 59, 59, 999)); // 23:59:59

    const stats = await Statistic.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfLastWeek, $lte: endOfLastWeek },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalQuantity: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
        },
      },
    ]);

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});


// API Thống kê 3 tháng trước:
app.get("/statistics/last-three-months", async (req, res) => {
  try {
    const today = new Date();
    today.setMonth(today.getMonth() - 3); // Trừ đi 3 tháng
    const startOfThreeMonthsAgo = new Date(today.setDate(1)); // Ngày đầu tiên của 3 tháng trước
    const endOfThreeMonthsAgo = new Date(today.setMonth(today.getMonth() + 3)); // Ngày đầu tiên của tháng hiện tại

    endOfThreeMonthsAgo.setDate(endOfThreeMonthsAgo.getDate() - 1); // Chỉnh lại ngày cuối cùng của 3 tháng trước
    endOfThreeMonthsAgo.setHours(23, 59, 59, 999); // 23:59:59

    const stats = await Statistic.aggregate([
      {
        $match: {
          purchaseDate: { $gte: startOfThreeMonthsAgo, $lte: endOfThreeMonthsAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
          totalCost: { $sum: { $multiply: ["$purchasePrice", "$quantity"] } },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          totalRevenue: 1,
          totalCost: 1,
          totalQuantity: 1,
          totalProfit: { $subtract: ["$totalRevenue", "$totalCost"] },
        },
      },
    ]);

    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});



app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
