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
import Voucher from './VoucherModel';
import FeebackModel from "./FeebackModel";
import ChatModel from "./ChatModel";
import FeebackAppModel from "./FeebackAppModel";
// import FeebackAppModel from './FeebackAppModel';


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

// API để chat

app.get('/messages/:cusId/:userId', async (req, res) => {
  const { cusId, userId } = req.params;

  try {
    // Tìm kiếm các tin nhắn giữa cusId và userId
    const messages = await ChatModel.find({
      cusId: cusId, // Tìm theo cusId
      userId: userId, // Tìm theo userId
    }).sort({ timestamp: 1 }); // Sắp xếp theo thời gian gửi (tăng dần)

    // Nếu không tìm thấy tin nhắn
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
// app.get('/messages/:cusId/:userId', async (req, res) => {
//   const { cusId, userId } = req.params;
//   console.log("cusId:", cusId);
//   // In ra giá trị userId nhận được từ yêu cầu để kiểm tra
//   console.log("userId:", userId);

//   // Kiểm tra userId có hợp lệ không (24 ký tự hex)
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     return res.status(400).json({ error: 'userId không hợp lệ.' });
//   }

//   try {
//     // Tìm kiếm các tin nhắn giữa cusId và userId
//     const messages = await ChatModel.find({
//       cusId: cusId, // Tìm theo cusId
//       userId: new mongoose.Types.ObjectId(userId), // Chuyển userId thành ObjectId (sử dụng 'new')
//     })
//     .populate('userId', 'name email')  // Populate thông tin từ bảng User (name, email)
//     .sort({ timestamp: 1 }); // Sắp xếp theo thời gian gửi (tăng dần)

//     // Nếu không tìm thấy tin nhắn
//     if (messages.length === 0) {
//       return res.status(404).json({ error: 'Không tìm thấy tin nhắn.' });
//     }

//     // Trả về danh sách tin nhắn
//     res.status(200).json(messages);
//   } catch (error) {
//     console.error('Lỗi khi lấy tin nhắn:', error);
//     res.status(500).json({ error: 'Lỗi khi lấy tin nhắn.' });
//   }
// });

// Lấy tất cả tin nhắn
app.get('/messages', async (req, res) => {
  try {
    // Lấy tất cả tin nhắn từ collection `chat`, chỉ trả về các thuộc tính cần thiết
    const messages = await ChatModel.find()
      .select('message chatStatus timestamp') // Chỉ lấy message, chatStatus và timestamp
      .sort({ timestamp: 1 });

    if (!messages.length) {
      return res.status(404).json({ error: 'Không có tin nhắn nào.' });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn.' });
  }
});


// Lấy tin nhắn theo cusId
app.get('/messages/:cusId', async (req, res) => {
  const cusId = req.params.cusId;

  if (!cusId) {
    return res.status(400).json({ error: 'Thiếu cusId.' });
  }

  try {
    // Tìm tin nhắn theo cusId
    const messages = await ChatModel.find({ cusId }).sort({ timestamp: 1 });

    if (!messages.length) {
      return res.status(404).json({ error: 'Không có tin nhắn nào cho cusId này.' });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn theo cusId:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy tin nhắn.' });
  }
});

//xóa tin nhắn theo _id
app.delete('/messages/:id', async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu id.' });
  }

  try {
    // Tìm và xóa tin nhắn theo id
    const deletedMessage = await ChatModel.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({ error: 'Không tìm thấy tin nhắn để xóa.' });
    }

    res.status(200).json({ message: 'Xóa tin nhắn thành công.', data: deletedMessage });
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa tin nhắn.' });
  }
});

// xóa theo cusId
app.delete('/messages/customer/:cusId', async (req, res) => {
  const cusId = req.params.cusId;

  if (!cusId) {
    return res.status(400).json({ error: 'Thiếu cusId.' });
  }

  try {
    // Xóa tất cả tin nhắn của cusId
    const result = await ChatModel.deleteMany({ cusId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tin nhắn để xóa.' });
    }

    res.status(200).json({ message: 'Xóa tất cả tin nhắn thành công.', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn theo cusId:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa tin nhắn.' });
  }
});


//thêm tin nhắn
app.post('/messages', async (req, res) => {
  const { cusId, userId, message, chatType, chatStatus } = req.body;

  // Kiểm tra dữ liệu gửi lên
  if (!cusId || !userId || !message || !chatType) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (cusId, userId, message, chatType).' });
  }

  try {
    // Tạo một tin nhắn mới
    const newMessage = new ChatModel({
      cusId,
      userId,
      message,
      chatType,
      chatStatus: chatStatus || 'Đã gửi', // Nếu không có chatStatus, dùng giá trị mặc định
    });

    // Lưu tin nhắn vào cơ sở dữ liệu
    const savedMessage = await newMessage.save();

    res.status(201).json({ message: 'Tin nhắn được thêm thành công.', data: savedMessage });
  } catch (error) {
    console.error('Lỗi khi thêm tin nhắn:', error);
    res.status(500).json({ error: 'Lỗi server khi thêm tin nhắn.' });
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
// app.get("/feedbacks", async (req, res) => {
//   try {
//     // Lấy tất cả dữ liệu phản hồi từ cơ sở dữ liệu
//     const feedbacks = await FeebackModel.find().populate('cusId prodId'); // Populate để lấy thông tin từ 'cusId' và 'prodId'

//     // Normalized dữ liệu
//     const normalizedFeedbacks = feedbacks.map(feedback => ({
//       _id: feedback._id, // Giữ nguyên trường _id
//       cusId: feedback.cusId, // Lấy thông tin khách hàng (có thể mở rộng nếu cần)
//       prodId: feedback.prodId, // Lấy thông tin sản phẩm (có thể mở rộng nếu cần)
//       stars: feedback.stars,
//       content: feedback.content,
//       dateFeed: feedback.dateFeed
//     }));

//     // Trả về danh sách feedback đã được chuẩn hóa
//     res.status(200).json(normalizedFeedbacks);
//   } catch (error) {
//     // Trả về lỗi nếu có vấn đề trong quá trình lấy dữ liệu
//     res.status(500).json({ message: "Lỗi khi lấy dữ liệu phản hồi", error });
//   }
// });

app.get("/feedbacks", async (req, res) => {
  try {
    // Lấy dữ liệu feedback từ cơ sở dữ liệu
    console.log("Fetching feedbacks...");
    const feedbacks = await FeebackModel.find().populate("prodId", "name price");
    console.log("Feedbacks fetched:", feedbacks);
    

    // Chuẩn hóa dữ liệu trả về
    const normalizedFeedbacks = feedbacks.map(feedback => ({
      id: feedback._id,
      cusId: feedback.cusId,
      prodId: feedback.prodId,
      stars: feedback.start,
      content: feedback.content,
      dateFeed: feedback.dateFeed,
    }));

    // Trả về phản hồi
    res.status(200).json(normalizedFeedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error); // Ghi lỗi vào console để debug
    res.status(500).json({ 
        message: "Lỗi khi lấy dữ liệu feedback", 
        error: error // Bao gồm chi tiết lỗi 
    });
}

});

/////////////////
// API để xóa phản hồi theo id
app.delete('/feedbacks/:id', async (req, res) => {
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

///// FeedbackApp
// Lấy tất cả dữ liệu feedbackap
app.get("/feebackapps", async (req, res) => {
  try {
      console.log("Fetching feedbacks...");

      // Lấy tất cả dữ liệu từ MongoDB
      const feedbackapps = await FeebackAppModel.find();  // TypeScript sẽ tự suy luận kiểu dữ liệu

      console.log("Feedbacks fetched:", feedbackapps);

      // Chuẩn hóa dữ liệu trả về
      const normalizedFeedbacks = feedbackapps.map((feedbackapp) => ({
          id: feedbackapp._id,
          cusId: feedbackapp.cusId,
          start: feedbackapp.start,
          content: feedbackapp.content,
          dateFeed: feedbackapp.dateFeed,
      }));

      // Trả về phản hồi
      res.status(200).json(normalizedFeedbacks);
  } catch (error: any) {  // Xử lý kiểu 'unknown' cho error
      console.error("Error fetching feedbacks:", error); // Ghi lỗi vào console để debug
      res.status(500).json({ 
          message: "Lỗi khi lấy dữ liệu feedback", 
          error: error.message // Bao gồm chi tiết lỗi 
      });
  }
});


// Xóa feedbackapp theo ID
app.delete("/feebackapps/:id", async (req, res) => {
  try {
      const { id } = req.params;  // Lấy id từ URL params

      console.log(`Deleting feedback with id: ${id}`);

      // Tìm và xóa feedback theo ID
      const deletedFeedback = await FeebackAppModel.findByIdAndDelete(id);

      if (!deletedFeedback) {
          return res.status(404).json({
              message: "Feedback không tồn tại",
          });
      }

      console.log("Feedback deleted:", deletedFeedback);

      // Trả về phản hồi sau khi xóa thành công
      res.status(200).json({
          message: "Feedback đã được xóa thành công",
          deletedFeedback: deletedFeedback, // Trả về thông tin của feedback đã xóa
      });

  } catch (error: any) {
      console.error("Error deleting feedback:", error);
      res.status(500).json({
          message: "Lỗi khi xóa feedback",
          error: error.message,
      });
  }
});


app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
