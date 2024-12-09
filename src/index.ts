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
import Chat from './ChatModel';
import Voucher from './VoucherModel';
import FeebackModel from "./FeebackModel";
import ChatModel from "./ChatModel";

// import Statistic from "./Statistic";
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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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


//////


//------------//

// API để tạo tin nhắn mới (POST)

app.get('/messages/:userId/:cusId', async (req, res) => {
  const { userId, cusId } = req.params;

  try {
    // Truy vấn tin nhắn theo userId và cusId
    const messages = await ChatModel.find({
      userId: userId,  // Trường userId từ model
      cusId: cusId,    // Trường cusId từ model
    }).sort({ timestamp: 1 }); // Sắp xếp theo thời gian gửi tin nhắn

    // Nếu không có tin nhắn, trả về lỗi 404
    if (messages.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tin nhắn.' });
    }

    // Trả về danh sách tin nhắn
    res.status(200).json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn.' });
  }
});



app.get('/messages', async (req, res) => {
  try {
    // Lấy tất cả tin nhắn từ collection `chat`
    const messages = await ChatModel.find().sort({ timestamp: 1 });

    if (!messages.length) {
      return res.status(404).json({ error: 'Không có tin nhắn nào.' });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn.' });
  }
});












//--------------//

app.get("/vouchers", async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    const normalizedVouchers = vouchers.map(voucher => ({
      _id: voucher._id, // Giữ nguyên trường _id
      price_reduced: voucher.price_reduced,
      discount_code: voucher.discount_code,
      quantity_voucher: voucher.quantity_voucher
    }));
    res.status(200).json(normalizedVouchers);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách voucher", error });
  }
});
// Api lấy theo id
app.get('/vouchers/:id', (req, res) => {
  const { id } = req.params;
  // Lấy voucher từ cơ sở dữ liệu với ID
  Voucher.findById(id)
    .then(voucher => {
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher không tồn tại' });
      }
      res.json(voucher);
    })
    .catch(error => res.status(500).json({ message: error.message }));
});

// API thêm Voucher
app.post("/vouchers/add", async (req, res) => {
  try {
    // Lấy dữ liệu từ body của request
    const { price_reduced, discount_code, quantity_voucher } = req.body;

    // Kiểm tra nếu các trường bắt buộc không được cung cấp
    if (!price_reduced || !discount_code || !quantity_voucher) {
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin." });
    }

    // Tạo một voucher mới
    const newVoucher = new Voucher({
      price_reduced,
      discount_code,
      quantity_voucher
    });

    // Lưu vào database
    const savedVoucher = await newVoucher.save();

    // Phản hồi thành công
    res.status(201).json({
      message: "Voucher đã được thêm thành công",
      voucher: savedVoucher
    });
  } catch (error) {
    // Bắt lỗi và phản hồi
    if (error instanceof Error && 'code' in error) {
      if (error.code === 11000) {
        res.status(400).json({ message: "Mã giảm giá đã tồn tại." });
        return;
      }
    }
  }
});



//API sửa Voucher
app.put("/vouchers/:id", async (req, res) => {
  const { price_reduced, discount_code, quantity_voucher } = req.body;

  try {
    // Cập nhật voucher theo ID
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      req.params.id,  // Đảm bảo sử dụng req.params.id thay vì req.params._id
      { price_reduced, discount_code, quantity_voucher },
      { new: true } // Trả về bản ghi đã được cập nhật
    );

    if (updatedVoucher) {
      res.status(200).json(updatedVoucher);
    } else {
      res.status(404).json({ message: "Voucher không tồn tại" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi sửa voucher", error });
  }
});

// API xóa Voucher
app.delete("/vouchers/:id", async (req, res) => {
  try {
    // Xóa voucher theo ID
    const deletedVoucher = await Voucher.findByIdAndDelete(req.params.id);
    if (deletedVoucher) {
      res.status(200).json({ message: "Voucher đã được xóa" });
    } else {
      res.status(404).json({ message: "Không tìm thấy voucher để xóa" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa voucher", error });
  }
});

/////////
/////--------///
//Feedback
// API để lấy tất cả phản hồi
app.get("/feedbacks", async (req, res) => {
  try {
    // Lấy tất cả dữ liệu phản hồi từ cơ sở dữ liệu
    const feedbacks = await FeebackModel.find().populate('cusId prodId'); // Populate để lấy thông tin từ 'cusId' và 'prodId'

    // Normalized dữ liệu
    const normalizedFeedbacks = feedbacks.map(feedback => ({
      _id: feedback._id, // Giữ nguyên trường _id
      cusId: feedback.cusId, // Lấy thông tin khách hàng (có thể mở rộng nếu cần)
      prodId: feedback.prodId, // Lấy thông tin sản phẩm (có thể mở rộng nếu cần)
      stars: feedback.stars,
      content: feedback.content,
      dateFeed: feedback.dateFeed
    }));

    // Trả về danh sách feedback đã được chuẩn hóa
    res.status(200).json(normalizedFeedbacks);
  } catch (error) {
    // Trả về lỗi nếu có vấn đề trong quá trình lấy dữ liệu
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu phản hồi", error });
  }
});



/////////////////
// API để xóa phản hồi theo id
app.delete('/feedback/:id', async (req, res) => {
  const { id } = req.params; // Lấy id từ params

  try {
    // Tìm và xóa phản hồi theo id
    const feedback = await FeebackModel.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ message: 'Không tìm thấy phản hồi để xóa' });
    }

    res.status(200).json({ message: 'Phản hồi đã được xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa phản hồi', error });
  }
});



app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
