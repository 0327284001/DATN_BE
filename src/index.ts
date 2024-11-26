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

    const { statusPro, price, desPro, creatDatePro, quantity, listPro, imgPro, namePro, cateId, brand } = req.body;
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
      brand
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

//

// API: Lấy tổng doanh thu của tất cả sản phẩm
app.get("/revenue/total", async (req: Request, res: Response) => {
  try {
    // Tính tổng doanh thu từ tất cả sản phẩm
    // Doanh thu = price * quantitySold
    const products = await Product.find();
    const totalRevenue = products.reduce((sum, product) => {
      const revenue = product.price * (product.quantitySold || 0); // quantitySold là trường dữ liệu mô tả số lượng đã bán
      return sum + revenue;
    }, 0);
    
    res.json({
      message: "Tổng doanh thu",
      totalRevenue,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tính tổng doanh thu" });
  }
});

// API: Lấy doanh thu chi tiết theo sản phẩm
app.get("/revenue/product/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Tìm sản phẩm theo ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const revenue = product.price * (product.quantitySold || 0); // Tính doanh thu cho sản phẩm cụ thể

    res.json({
      message: `Doanh thu chi tiết cho sản phẩm ${product.namePro}`,
      revenue,
      product,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy doanh thu chi tiết" });
  }
});

// API: Lấy doanh thu theo danh mục
app.get("/revenue/category/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Lấy tất cả sản phẩm thuộc danh mục
    const products = await Product.find({ cateId: id });

    if (products.length === 0) {
      return res.status(404).json({ message: "Không có sản phẩm trong danh mục này" });
    }

    // Tính tổng doanh thu cho danh mục
    const categoryRevenue = products.reduce((sum, product) => {
      const revenue = product.price * (product.quantitySold || 0);
      return sum + revenue;
    }, 0);

    res.json({
      message: "Doanh thu theo danh mục",
      categoryRevenue,
      categoryId: id,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tính doanh thu theo danh mục" });
  }
});

// API: Lấy danh sách sản phẩm bán chạy nhất (top N sản phẩm)
app.get("/revenue/top-products/:top", async (req: Request, res: Response) => {
  try {
    const { top } = req.params;
    const topN = parseInt(top, 10);

    // Lấy danh sách sản phẩm và sắp xếp theo số lượng bán giảm dần
    const products = await Product.find().sort({ quantitySold: -1 }).limit(topN);

    res.json({
      message: `Top ${topN} sản phẩm bán chạy nhất`,
      products,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm bán chạy" });
  }
});

// API: Lấy doanh thu theo ngày
app.get("/revenue/daily", async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const products = await Product.find({
      soldDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    const dailyRevenue = products.reduce((sum, product) => {
      return sum + product.price * (product.quantitySold || 0);
    }, 0);

    res.json({
      message: "Doanh thu hôm nay",
      dailyRevenue,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tính doanh thu theo ngày" });
  }
});


// API: Lấy doanh thu theo tuần
app.get("/revenue/weekly", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfWeek = new Date(
      now.setDate(now.getDate() - now.getDay())
    ); // Ngày đầu tuần (Chủ nhật)
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const products = await Product.find({
      soldDate: { $gte: firstDayOfWeek, $lt: new Date() },
    });

    const weeklyRevenue = products.reduce((sum, product) => {
      return sum + product.price * (product.quantitySold || 0);
    }, 0);

    res.json({
      message: "Doanh thu tuần này",
      weeklyRevenue,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tính doanh thu theo tuần" });
  }
});


// API: Lấy doanh thu theo tháng
app.get("/revenue/monthly", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const products = await Product.find({
      soldDate: { $gte: firstDayOfMonth, $lt: new Date() },
    });

    const monthlyRevenue = products.reduce((sum, product) => {
      return sum + product.price * (product.quantitySold || 0);
    }, 0);

    res.json({
      message: "Doanh thu tháng này",
      monthlyRevenue,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tính doanh thu theo tháng" });
  }
});


// API: Lấy doanh thu theo năm
app.get("/revenue/yearly", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const products = await Product.find({
      soldDate: { $gte: firstDayOfYear, $lt: new Date() },
    });

    const yearlyRevenue = products.reduce((sum, product) => {
      return sum + product.price * (product.quantitySold || 0);
    }, 0);

    res.json({
      message: "Doanh thu năm nay",
      yearlyRevenue,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tính doanh thu theo năm" });
  }
});

//Cập nhật khi bán sản phẩm
app.post("/product/sell/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantitySold } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        $inc: { quantitySold },
        soldDate: new Date(),
      },
      { new: true }
    );

    res.json({
      message: "Cập nhật thông tin bán hàng thành công",
      product,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm đã bán" });
  }
});


app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
