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
import ArtStoryModel from "./ArtStoryModel";
import OrderModel from "./OrderModel";
import transaction from "./transaction";
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
app.get("/analytics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      orderStatus: "Đã giao",
      ...(startDate &&
        endDate && {
          orderDate: {
            $gte: new Date(startDate as any),
            $lte: new Date(endDate as any),
          },
        }),
    };

    const orders = await OrderModel.find(filter);

    if (!orders.length) {
      return res.status(404).json({ message: "Không có đơn hàng phù hợp." });
    }

    let totalRevenue = 0;
    let totalProfit = 0;
    const productStats: any = {} as any;

    for (const order of orders) {
      for (const detail of order.prodDetails) {
        const product: any = await Product.findById(detail.prodId);
        console.log(detail, "ok");
        if (product) {
          const new_price =
            Number(product.import_price) * Number(detail.quantity);
          const profit = Number(detail.revenue) - new_price;

          totalRevenue += detail.revenue;
          totalProfit += profit;

          // Thống kê sản phẩm
          if (!productStats[detail.prodId as any]) {
            productStats[detail.prodId as any] = {
              name: product.namePro,
              image: product.imgPro,
              revenue: 0,
              profit: 0,
              quantity: 0,
            };
          }
          productStats[detail.prodId as any].revenue += detail.revenue;
          productStats[detail.prodId as any].profit += profit;
          productStats[detail.prodId as any].quantity += detail.quantity;
        }
      }
    }

    // Sắp xếp sản phẩm đóng góp nhiều nhất
    const topProduct = Object.entries(productStats).sort(
      (a: any, b: any) => b[1].revenue - a[1].revenue
    )[0] as any;

    return res.json({
      totalRevenue,
      totalProfit,
      topProduct: topProduct
        ? { prodId: topProduct[0], ...topProduct[1] }
        : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi trong quá trình xử lý dữ liệu." });
  }
});
process.env.TZ = "Asia/Ho_Chi_Minh";
function sortObject(obj: any) {
  let sorted = {} as any;
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// Thanh toán
// app.post("/create-checkout-vnpay", async (req: any, res: any) => {
//   try {
//     const secretKey = "AKQGTMHAUVVJONTQYGIBVQFFDRIHLWRX";
//     let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
//     const ip =
//       req.headers["x-forwarded-for"] ||
//       req.connection.remoteAddress ||
//       req.socket.remoteAddress ||
//       req.connection.socket.remoteAddress;

//     const amount = req.body.total;
//     const returnUrlLocal = req.query.returnUrlLocal;

//     let vnp_Params = {} as any;
//     vnp_Params["vnp_Version"] = "2.1.0";
//     vnp_Params["vnp_Command"] = "pay";
//     vnp_Params["vnp_TmnCode"] = "0NAC2BZW";
//     vnp_Params["vnp_Amount"] = amount * 100;
//     vnp_Params["vnp_BankCode"] = "NCB";
//     vnp_Params["vnp_CreateDate"] = moment(new Date()).format("YYYYMMDDHHmmss");
//     vnp_Params["vnp_CurrCode"] = "VND";
//     vnp_Params["vnp_IpAddr"] = ip;
//     vnp_Params["vnp_Locale"] = "vn";
//     vnp_Params["vnp_OrderInfo"] = "Thanh_toan_don_hang";
//     // vnp_Params[
//     //   "vnp_ReturnUrl"
//     // ] = `https://fe-healthy-food-store.vercel.app/payment-result?userId=${
//     //   req.body.user
//     // }&expire=${moment(new Date()).add(15, "minute").toDate().getTime()}`;
//     vnp_Params["vnp_ReturnUrl"] = `${req.body.returnUrl}?userId=${
//       req.body.user
//     }&expire=${moment(new Date()).add(15, "minute").toDate().getTime()}`;
//     vnp_Params["vnp_TxnRef"] = moment(new Date()).format("DDHHmmss");

//     vnp_Params["vnp_OrderType"] = "other";

//     vnp_Params = sortObject(vnp_Params);
//     const signData = querystring.stringify(vnp_Params, { encode: false });
//     const hmac = crypto.createHmac("sha512", secretKey);
//     const signed = hmac.update(signData).digest("hex");
//     vnp_Params["vnp_SecureHash"] = signed;
//     vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
//     await transaction.create({
//       amount: amount,
//       date: new Date(),
//     });
//     res.send({ url: vnpUrl });
//   } catch (error) {
//     return res.status(500, { message: "Error server" });
//   }
// });
// Lấy thông tin sản phẩm

app.get("/transactions", async (req, res) => {
  try {
    const data = await transaction.find({});
    return res.json(data);
  } catch (error: any) {
    return res.json({ message: error.message });
  }
});

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


/////////-----------------///////
app.get('/chats', async (req, res) => {
  try {
    const chats = await ChatModel.find(); // Lấy tất cả dữ liệu từ bảng chats
    res.json(chats); // Trả về dữ liệu dưới dạng JSON
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu' });
  }
});

// API để lấy tin nhắn theo ID
app.get('/chats/:id', async (req, res) => {
  const { id } = req.params; // Lấy id từ URL params
  try {
    const chat = await ChatModel.findById(id); // Lấy tin nhắn theo ID
    if (!chat) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }
    res.json(chat); // Trả về tin nhắn dưới dạng JSON
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn theo ID:', error);
    res.status(500).json({ message: 'Lỗi khi lấy tin nhắn theo ID' });
  }
});

// API để lấy tin nhắn theo cusId (ID khách hàng)
app.get('/chats/customer/:cusId', async (req, res) => {
  const { cusId } = req.params; // Lấy cusId từ URL params
  try {
    const chats = await ChatModel.find({ cusId }); // Lấy tất cả tin nhắn theo cusId
    if (chats.length === 0) {
      return res.status(404).json({ message: 'Không có tin nhắn cho khách hàng này' });
    }
    res.json(chats); // Trả về danh sách tin nhắn cho cusId
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn theo cusId:', error);
    res.status(500).json({ message: 'Lỗi khi lấy tin nhắn theo cusId' });
  }
});

app.delete('/chats/customer/:cusId', async (req, res) => {
  const { cusId } = req.params; // Lấy cusId từ URL params
  try {
    const result = await ChatModel.deleteMany({ cusId }); // Xóa tất cả tin nhắn theo cusId
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn để xóa cho khách hàng này' });
    }
    res.json({ message: 'Xóa cuộc trò chuyện thành công' }); // Trả về thông báo thành công
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn theo cusId:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tin nhắn theo cusId' });
  }
});

app.delete('/chats/:id', async (req, res) => {
  const { id } = req.params; // Lấy _id của tin nhắn từ URL params
  try {
    const result = await ChatModel.deleteOne({ _id: id }); // Xóa tin nhắn theo _id
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn với ID này' });
    }
    res.json({ message: 'Xóa tin nhắn thành công' }); // Trả về thông báo thành công
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tin nhắn' });
  }
});



// Endpoint lấy tất cả tin nhắn
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

//  lấy tin nhắn theo `_id`
app.get('/messages/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Tìm tin nhắn theo `_id`
    const message = await ChatModel.findById(id)
      .select('message chatStatus timestamp'); // Chỉ lấy message, chatStatus và timestamp

    if (!message) {
      return res.status(404).json({ error: `Không tìm thấy tin nhắn với _id: ${id}` });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error('Lỗi khi lấy tin nhắn theo _id:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tin nhắn theo _id.' });
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
  const { id } = req.params;
  try {
    const result = await ChatModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn với ID này' });
    }
    res.json({ message: 'Xóa tin nhắn thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa tin nhắn:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tin nhắn' });
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
      _id: voucher._id,
      price_reduced: voucher.price_reduced,
      discount_code: voucher.discount_code,
      type_voucher: voucher.type_voucher, // Thêm type_voucher
      quantity_voucher: voucher.quantity_voucher,
    }));
    res.status(200).json(normalizedVouchers);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách voucher", error });
  }
});

// Api lấy theo id
app.get('/vouchers/:id', async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher không tồn tại' });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy voucher theo ID", error });
  }
});


// API thêm Voucher
app.post("/vouchers/add", async (req, res) => {
  try {
    const { price_reduced, discount_code, type_voucher, quantity_voucher } = req.body;

    // Kiểm tra nếu các trường bắt buộc không được cung cấp
    if (!price_reduced || !discount_code || !type_voucher || !quantity_voucher) {
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin." });
    }

    // Tạo một voucher mới
    const newVoucher = new Voucher({
      price_reduced,
      discount_code,
      type_voucher,
      quantity_voucher,
    });

    const savedVoucher = await newVoucher.save();
    res.status(201).json({
      message: "Voucher đã được thêm thành công",
      voucher: savedVoucher,
    });
  } catch (error) {
    if (error === 11000) {
      res.status(400).json({ message: "Mã giảm giá đã tồn tại." });
    } else {
      res.status(500).json({ message: "Lỗi khi thêm voucher", error });
    }
  }
});




//API sửa Voucher
app.put("/vouchers/:id", async (req, res) => {
  const { price_reduced, discount_code, type_voucher, quantity_voucher } = req.body;

  try {
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { price_reduced, discount_code, type_voucher, quantity_voucher },
      { new: true }
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

//crud artstory(tin tức)
app.get(
  "/artstories",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const artStories = await ArtStoryModel.find();
      res.status(200).json(artStories); 
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error });
    }
  })
);


//lấy theo id
app.get(
  "/artstories/:id",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const artStory = await ArtStoryModel.findById(id);

      if (!artStory) {
        return res.status(404).json({ message: "Không tìm thấy tin tức" });
      }

      res.status(200).json(artStory);
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error });
    }
  })
);

//thêm tin tức
// Khi nhận được yêu cầu từ frontend, lưu thông tin bài viết với URL ảnh vào MongoDB
app.post('/artstories', async (req, res) => {
  console.log(req.body); 
  const { title, author, date, description, content, caption, imageUrl } = req.body;
  const newArtStory = new ArtStoryModel({
    title,
    author,
    date,
    description,
    content,
    caption,
    imageUrl,  // Lưu URL ảnh vào MongoDB
  });

  try {
    await newArtStory.save();
    res.status(201).send({ message: 'Thêm mới thành công!' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Lỗi khi lưu dữ liệu!' });
  }
});

//api sửa tin tức theo id
app.put(
  "/artstories/:id",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params; 
      const { title, author, description, content, caption, imageUrl } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

      const updatedArtStory = await ArtStoryModel.findByIdAndUpdate(
        id,
        {
          title,
          author,
          description,
          content,
          caption,
          imageUrl,
        },
        { new: true } 
      );

      
      if (!updatedArtStory) {
        return res.status(404).json({ message: "Không tìm thấy tin tức" });
      }

     
      res.status(200).json({
        message: "Cập nhật tin tức thành công",
        artStory: updatedArtStory,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error });
    }
  })
);

app.delete(
  "/artstories/:id",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params; 

      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID không hợp lệ" });
      }

     
      const deletedArtStory = await ArtStoryModel.findByIdAndDelete(id);

      
      if (!deletedArtStory) {
        return res.status(404).json({ message: "Không tìm thấy tin tức để xóa" });
      }

     
      res.status(200).json({
        message: "Xóa tin tức thành công",
        artStory: deletedArtStory,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error });
    }
  })
);


app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
